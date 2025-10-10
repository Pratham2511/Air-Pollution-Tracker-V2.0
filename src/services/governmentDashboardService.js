import { supabase, hasSupabaseCredentials } from './supabaseClient';
import { CITY_CATALOG, CITY_CATALOG_BY_ID } from '../data/cityCatalog';

const GOV_LIVE_METRICS_TABLE = 'gov_live_metrics';
const GOV_INCIDENTS_TABLE = 'gov_incidents';
const GOV_NOTES_TABLE = 'gov_notes';

const INCIDENT_STORAGE_KEY = 'aqt::gov-incidents@v1';
const INCIDENT_ACTIVITY_STORAGE_KEY = 'aqt::incident-activity@v1';
const UPLOAD_STORAGE_KEY = 'aqt::gov-uploads@v1';

const statusFromAqi = (aqi) => {
  if (aqi >= 300) return 'Hazard';
  if (aqi >= 200) return 'Alert';
  if (aqi >= 150) return 'Watch';
  return 'Stable';
};

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const normalize = (value, min, max) => (value - min) / Math.max(max - min, 1);

const classifyHotspotSeverity = (aqi) => {
  if (aqi >= 400) return 'critical';
  if (aqi >= 300) return 'severe';
  if (aqi >= 200) return 'alert';
  if (aqi >= 150) return 'watch';
  return 'stable';
};

const detectSpikeCategory = (delta) => {
  if (delta >= 60) return 'extreme';
  if (delta >= 40) return 'major';
  if (delta >= 25) return 'moderate';
  if (delta <= -30) return 'cooldown';
  return 'steady';
};

const decorateHotspotMetrics = (entries = []) =>
  entries.map((entry, index) => {
    const spikeCategory = detectSpikeCategory(entry.delta ?? 0);
    return {
      ...entry,
      rank: index + 1,
      severity: classifyHotspotSeverity(entry.aqi ?? 0),
      spikeCategory,
      isSpike: ['moderate', 'major', 'extreme'].includes(spikeCategory),
      momentum: entry.delta ?? 0,
    };
  });

const generateLiveMetricsFallback = (limit = 50) => {
  const sortedCities = [...CITY_CATALOG]
    .sort((a, b) => b.aqi - a.aqi)
    .slice(0, Math.min(limit * 2, CITY_CATALOG.length));

  const now = Date.now();

  return sortedCities.slice(0, limit).map((city, index) => {
    const seed = now / (index + 1);
    const variance = Math.round((seededRandom(seed) - 0.4) * 40);
    const aqi = Math.max(20, city.aqi + variance);
    const delta = Math.round((seededRandom(seed * 3.14) - 0.45) * 30);

    return {
      id: `${city.id}-${index}`,
      cityId: city.id,
      city: `${city.name}, ${city.country}`,
      state: city.region,
      aqi,
      dominantPollutant: city.dominantPollutant,
      delta,
      status: statusFromAqi(aqi),
      updatedAt: new Date(now - seededRandom(seed) * 6 * 60 * 1000).toISOString(),
    };
  });
};

const generateHistoricalSeriesFallback = (cityId) => {
  const baseCity = CITY_CATALOG_BY_ID[cityId] ?? CITY_CATALOG[0];
  const now = Date.now();
  const series = ['24h', '7d', '30d'];

  return series.reduce((acc, window) => {
    const points = Array.from({ length: window === '24h' ? 24 : window === '7d' ? 7 : 30 }).map((_, index) => {
      const seed = now / ((index + 1) * (window.length + 1));
      const variance = Math.round((seededRandom(seed) - 0.45) * 35);
      const aqi = Math.max(28, baseCity.aqi + variance);
      return {
        label: window === '24h' ? `${index}:00` : `Day ${index + 1}`,
        aqi,
        forecast: Math.round(aqi * (0.96 + seededRandom(seed * 1.37) * 0.08)),
      };
    });
    acc[window] = points;
    return acc;
  }, {});
};

const generatePollutantBreakdownFallback = () => {
  const totals = CITY_CATALOG.reduce(
    (acc, city, index) => {
      const share = Math.round(12 + seededRandom((index + 1) * 2.1) * 8);
      acc[city.dominantPollutant] = (acc[city.dominantPollutant] ?? 0) + share;
      return acc;
    },
    {},
  );

  const entries = Object.entries(totals).map(([pollutant, total]) => ({ pollutant, total }));
  const totalSum = entries.reduce((sum, entry) => sum + entry.total, 0);

  return entries
    .sort((a, b) => b.total - a.total)
    .map((entry, index) => ({
      ...entry,
      share: Math.round((entry.total / Math.max(totalSum, 1)) * 100),
      classification: index === 0 ? 'Severe' : index === 1 ? 'High' : index === 2 ? 'Moderate' : 'Low',
    }));
};

const generateHeatmapFallback = () => {
  const topCities = [...CITY_CATALOG]
    .sort((a, b) => b.aqi - a.aqi)
    .slice(0, 200);

  const maxAqi = topCities[0]?.aqi ?? 300;
  const minAqi = topCities[topCities.length - 1]?.aqi ?? 30;

  return topCities.map((city, index) => {
    const intensity = normalize(city.aqi, minAqi, maxAqi);
    const jitter = seededRandom((index + 1) * 9.31) * 0.18 - 0.09;
    const jitterLat = seededRandom((index + 1) * 1.57) * 0.12 - 0.06;
    return {
      cityId: city.id,
      lat: city.lat + jitterLat,
      lng: city.lng + jitter,
      intensity: Number(intensity.toFixed(2)),
      name: city.name,
      aqi: city.aqi,
    };
  });
};

const generateHotspotFallback = (limit = 10) => {
  const base = generateLiveMetricsFallback(Math.max(limit, 20));
  const ranked = [...base]
    .sort((a, b) => b.aqi - a.aqi)
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      cityId: item.cityId,
      city: item.city,
      state: item.state,
      aqi: item.aqi,
      delta: item.delta,
      status: item.status,
      dominantPollutant: item.dominantPollutant,
      updatedAt: item.updatedAt,
    }));

  return decorateHotspotMetrics(ranked);
};

const readIncidentCache = () => {
  try {
    const stored = window.localStorage.getItem(INCIDENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

const writeIncidentCache = (incidents) => {
  try {
    window.localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(incidents));
  } catch (error) {
    // noop
  }
};

const readIncidentActivityCache = () => {
  try {
    const stored = window.localStorage.getItem(INCIDENT_ACTIVITY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

const writeIncidentActivityCache = (entries) => {
  try {
    window.localStorage.setItem(INCIDENT_ACTIVITY_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    // noop
  }
};

const readUploadCache = () => {
  try {
    const stored = window.localStorage.getItem(UPLOAD_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

const writeUploadCache = (uploads) => {
  try {
    window.localStorage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify(uploads));
  } catch (error) {
    // noop
  }
};

const withFallback = async (fn, fallback) => {
  try {
    const result = await fn();
    if (result?.error) {
      return { data: fallback, error: result.error };
    }
    return { data: result?.data ?? fallback, error: null };
  } catch (error) {
    return { data: fallback, error: error.message };
  }
};

export const fetchLiveMetrics = async ({ search, pollutant, status, limit = 50 } = {}) => withFallback(
  async () => {
    if (!hasSupabaseCredentials) {
      return { data: generateLiveMetricsFallback(limit) };
    }

    let query = supabase
      .from(GOV_LIVE_METRICS_TABLE)
      .select('*')
      .limit(limit)
      .order('aqi', { ascending: false });

    if (search) {
      query = query.ilike('city', `%${search}%`);
    }
    if (pollutant && pollutant !== 'all') {
      query = query.eq('dominant_pollutant', pollutant);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      return { error: error.message };
    }

    return {
      data: data.map((row) => ({
        id: row.id,
        cityId: row.city_id,
        city: row.city,
        state: row.state,
        aqi: row.aqi,
        dominantPollutant: row.dominant_pollutant,
        delta: row.delta,
        status: row.status,
        updatedAt: row.updated_at,
      })),
    };
  },
  generateLiveMetricsFallback(limit)
);

export const fetchHistoricalSeries = async ({ cityId }) => withFallback(
  async () => {
    if (!hasSupabaseCredentials) {
      return { data: generateHistoricalSeriesFallback(cityId) };
    }

    const { data, error } = await supabase
      .from('gov_historical_series')
      .select('window, points')
      .eq('city_id', cityId)
      .order('window');

    if (error) {
      return { error: error.message };
    }

    const mapped = data.reduce((acc, row) => {
      acc[row.window] = row.points;
      return acc;
    }, {});

    return { data: mapped };
  },
  generateHistoricalSeriesFallback(cityId)
);

export const fetchPollutantBreakdown = async () => withFallback(
  async () => {
    if (!hasSupabaseCredentials) {
      return { data: generatePollutantBreakdownFallback() };
    }

    const { data, error } = await supabase
      .from('gov_pollutant_breakdown')
      .select('pollutant, share, classification');

    if (error) {
      return { error: error.message };
    }

    return { data };
  },
  generatePollutantBreakdownFallback()
);

export const fetchHeatmapPoints = async () => withFallback(
  async () => {
    if (!hasSupabaseCredentials) {
      return { data: generateHeatmapFallback() };
    }

    const { data, error } = await supabase
      .from('gov_heatmap_points')
      .select('city_id, lat, lng, intensity, city_name, aqi');

    if (error) {
      return { error: error.message };
    }

    return {
      data: data.map((row) => ({
        cityId: row.city_id,
        lat: row.lat,
        lng: row.lng,
        intensity: row.intensity,
        name: row.city_name,
        aqi: row.aqi,
      })),
    };
  },
  generateHeatmapFallback()
);

export const fetchHotspotAlerts = async ({ limit = 10 } = {}) => withFallback(
  async () => {
    if (!hasSupabaseCredentials) {
      return { data: generateHotspotFallback(limit) };
    }

    const { data, error } = await supabase
      .from(GOV_LIVE_METRICS_TABLE)
      .select('id, city_id, city, state, aqi, delta, status, dominant_pollutant, updated_at')
      .order('aqi', { ascending: false })
      .limit(limit);

    if (error) {
      return { error: error.message };
    }

    const normalized = (data ?? []).map((row) => ({
      id: row.id,
      cityId: row.city_id,
      city: row.city,
      state: row.state,
      aqi: row.aqi,
      delta: row.delta,
      status: row.status,
      dominantPollutant: row.dominant_pollutant,
      updatedAt: row.updated_at,
    }));

    return { data: decorateHotspotMetrics(normalized) };
  },
  generateHotspotFallback(limit)
);

export const fetchIncidents = async () => withFallback(
  async () => {
    if (!hasSupabaseCredentials) {
      return { data: readIncidentCache() };
    }

    const { data, error } = await supabase
      .from(GOV_INCIDENTS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data };
  },
  readIncidentCache()
);

export const fetchIncidentActivity = async ({ incidentId, limit = 200 } = {}) => withFallback(
  async () => {
    if (!hasSupabaseCredentials) {
      const cached = readIncidentActivityCache();
      return {
        data: incidentId ? cached.filter((entry) => entry.incident_id === incidentId) : cached,
      };
    }

    let query = supabase
      .from('incident_activity')
      .select('id, incident_id, event_action, actor_id, actor_role, context, recorded_at, created_at')
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (incidentId) {
      query = query.eq('incident_id', incidentId);
    }

    const { data, error } = await query;
    if (error) {
      return { error: error.message };
    }

    return { data };
  },
  (() => {
    const cached = readIncidentActivityCache();
    return incidentId ? cached.filter((entry) => entry.incident_id === incidentId) : cached;
  })()
);

export const createIncident = async (incident) => {
  const payload = {
    id: incident.id,
    title: incident.title,
    severity: incident.severity,
    summary: incident.summary,
    status: incident.status,
    tags: incident.tags,
    assignedTo: incident.assignedTo,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
  };

  if (!hasSupabaseCredentials) {
    const incidents = readIncidentCache();
    const next = [payload, ...incidents];
    writeIncidentCache(next);
    return { data: payload };
  }

  const { data, error } = await supabase
    .from(GOV_INCIDENTS_TABLE)
    .insert({
      id: incident.id,
      title: incident.title,
      severity: incident.severity,
      summary: incident.summary,
      status: incident.status,
      tags: incident.tags,
      assigned_to: incident.assignedTo,
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
};

export const updateIncidentStatus = async ({ id, status }) => {
  if (!hasSupabaseCredentials) {
    const incidents = readIncidentCache();
    const next = incidents.map((item) => (item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item));
    writeIncidentCache(next);
    return { data: next.find((item) => item.id === id) };
  }

  const { data, error } = await supabase
    .from(GOV_INCIDENTS_TABLE)
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  return { data, error: error?.message ?? null };
};

export const deleteIncident = async (id) => {
  if (!hasSupabaseCredentials) {
    const incidents = readIncidentCache().filter((item) => item.id !== id);
    writeIncidentCache(incidents);
    return { data: true };
  }

  const { error } = await supabase
    .from(GOV_INCIDENTS_TABLE)
    .delete()
    .eq('id', id);

  return { error: error?.message ?? null };
};

export const fetchGovernmentNotes = async () => withFallback(
  async () => {
    if (!hasSupabaseCredentials) {
      return { data: [] };
    }
    const { data, error } = await supabase
      .from(GOV_NOTES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data };
  },
  []
);

export const fetchMeasurementUploads = async () => withFallback(
  async () => {
    if (!hasSupabaseCredentials) {
      return { data: readUploadCache() };
    }

    const { data, error } = await supabase
      .from('gov_measurement_uploads')
      .select('id, filename, status, total_rows, accepted_rows, rejected_rows, summary, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return {
      data: data.map((row) => ({
        id: row.id,
        filename: row.filename,
        status: row.status,
        totalRows: row.total_rows,
        acceptedRows: row.accepted_rows,
        rejectedRows: row.rejected_rows,
        summary: row.summary,
        createdAt: row.created_at,
      })),
    };
  },
  readUploadCache()
);

export const recordMeasurementUpload = async ({
  filename,
  totalRows,
  acceptedRows,
  rejectedRows,
  summary,
}) => {
  const payload = {
    id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : `upload-${Date.now()}`,
    filename,
    status: rejectedRows ? 'partial' : 'queued',
    totalRows,
    acceptedRows,
    rejectedRows,
    summary,
    createdAt: new Date().toISOString(),
  };

  if (!hasSupabaseCredentials) {
    const uploads = readUploadCache();
    writeUploadCache([payload, ...uploads]);
    return { data: payload };
  }

  const { data, error } = await supabase
    .from('gov_measurement_uploads')
    .insert({
      filename,
      status: payload.status,
      total_rows: totalRows,
      accepted_rows: acceptedRows,
      rejected_rows: rejectedRows,
      summary,
    })
    .select('id, filename, status, total_rows, accepted_rows, rejected_rows, summary, created_at')
    .single();

  if (error) {
    return { error: error.message, data: payload };
  }

  const mapped = {
    id: data.id,
    filename: data.filename,
    status: data.status,
    totalRows: data.total_rows,
    acceptedRows: data.accepted_rows,
    rejectedRows: data.rejected_rows,
    summary: data.summary,
    createdAt: data.created_at,
  };

  return { data: mapped };
};

export const buildCsv = (rows) => {
  const header = ['City', 'State/Region', 'AQI', 'Dominant Pollutant', 'Delta', 'Status', 'Last Updated'];
  const body = rows.map((row) => [row.city, row.state ?? '', row.aqi, row.dominantPollutant, row.delta, row.status, row.updatedAt ?? '']);
  return [header, ...body].map((line) => line.join(',')).join('\n');
};

export const buildJson = (rows) => JSON.stringify(rows, null, 2);

export const triggerDownload = (filename, content, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const subscribeToLiveMetrics = ({ interval = 30000, onTick }) => {
  const handle = setInterval(() => {
    const data = generateLiveMetricsFallback(30);
    onTick?.(data);
  }, interval);

  return () => clearInterval(handle);
};

export const GOVERNMENT_DEFAULT_CITY = CITY_CATALOG[0]?.id ?? 'delhi';