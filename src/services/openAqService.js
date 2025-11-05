/* global globalThis */

const OPENAQ_BASE_URL = 'https://api.openaq.org/v3';
const CACHE_PREFIX = 'aqt::openaq::city@v1';
const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_RADIUS_METERS = 25000;
const DEFAULT_LIMIT = 120;
const POLLUTANT_PARAMETERS = ['pm25', 'pm10', 'no2', 'so2', 'o3', 'co'];

const POLLUTANT_LABELS = {
  pm25: 'PM2.5',
  pm10: 'PM10',
  no2: 'NO₂',
  so2: 'SO₂',
  o3: 'O₃',
  co: 'CO',
};

const POLLUTANT_UNITS = {
  pm25: 'µg/m³',
  pm10: 'µg/m³',
  no2: 'µg/m³',
  so2: 'µg/m³',
  o3: 'µg/m³',
  co: 'ppm',
};

const roundTo = (value, precision = 1) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const breakpointAqi = (value, breakpoints) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const range = breakpoints.find((bp) => value >= bp.cLow && value <= bp.cHigh);
  if (!range) {
    const last = breakpoints[breakpoints.length - 1];
    if (!last) return 0;
    const bounded = Math.min(value, last.cHigh);
    return Math.round(((last.iHigh - last.iLow) / (last.cHigh - last.cLow)) * (bounded - last.cLow) + last.iLow);
  }

  const { cLow, cHigh, iLow, iHigh } = range;
  return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (value - cLow) + iLow);
};

const PM25_BREAKPOINTS = [
  { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
  { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];

const PM10_BREAKPOINTS = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
  { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
  { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
];

const DEFAULT_AQI_CALCULATORS = {
  pm25: (value) => breakpointAqi(value, PM25_BREAKPOINTS),
  pm10: (value) => breakpointAqi(value, PM10_BREAKPOINTS),
  no2: (value) => Math.round(Math.min(400, value * 0.53)),
  so2: (value) => Math.round(Math.min(400, value * 0.43)),
  o3: (value) => Math.round(Math.min(400, value * 0.66)),
  co: (value) => Math.round(Math.min(400, value * 50)),
};

const getApiKeyHeader = () => {
  const apiKey = process.env.REACT_APP_OPENAQ_API_KEY;
  if (!apiKey) return {};
  return {
    'X-API-Key': apiKey,
  };
};

const readCache = (key, ttlMs) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const cached = window.localStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);
    if (!parsed?.payload || !parsed?.expiresAt) {
      return null;
    }

    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.payload;
  } catch (error) {
    return null;
  }
};

const writeCache = (key, payload, ttlMs) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const expiresAt = Date.now() + ttlMs;
    window.localStorage.setItem(key, JSON.stringify({ payload, expiresAt }));
  } catch (error) {
    // noop on quota errors
  }
};

const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => searchParams.append(key, entry));
    } else {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};

const fetchMeasurements = async ({
  lat,
  lng,
  radius = DEFAULT_RADIUS_METERS,
  limit = DEFAULT_LIMIT,
  fetchImpl = globalThis.fetch,
  signal,
}) => {
  if (!fetchImpl || !lat || !lng) {
    return null;
  }

  const query = buildQueryString({
    coordinates: `${lat},${lng}`,
    radius,
    limit,
    sort: 'desc',
    order_by: 'datetime',
    page: 1,
    'parameters[]': POLLUTANT_PARAMETERS,
  });

  const url = `${OPENAQ_BASE_URL}/measurements?${query}`;
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/json',
      ...getApiKeyHeader(),
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`OpenAQ request failed: ${response.status}`);
  }

  const payload = await response.json();

  if (!payload?.results?.length) {
    return [];
  }

  return payload.results;
};

const aggregateMeasurements = (measurements = []) => {
  const aggregates = {};

  measurements.forEach((measurement) => {
    const key = measurement?.parameter?.toLowerCase();
    const value = Number(measurement?.value);
    if (!key || !Number.isFinite(value)) {
      return;
    }

    if (!aggregates[key]) {
      aggregates[key] = {
        sum: 0,
        count: 0,
        unit: measurement?.unit ?? POLLUTANT_UNITS[key] ?? '',
        lastUpdated: measurement?.date?.utc ?? null,
      };
    }

    aggregates[key].sum += value;
    aggregates[key].count += 1;
    if (measurement?.date?.utc && (!aggregates[key].lastUpdated || measurement.date.utc > aggregates[key].lastUpdated)) {
      aggregates[key].lastUpdated = measurement.date.utc;
    }
  });

  return Object.entries(aggregates).reduce((acc, [key, value]) => {
    acc[key] = {
      average: value.count ? value.sum / value.count : null,
      unit: value.unit,
      lastUpdated: value.lastUpdated,
    };
    return acc;
  }, {});
};

const computeAqiFromAggregates = (aggregates) => {
  let finalAqi = 0;
  let dominantKey = null;

  Object.entries(aggregates).forEach(([key, value]) => {
    const average = value?.average;
    if (!Number.isFinite(average)) {
      return;
    }

    const calculator = DEFAULT_AQI_CALCULATORS[key];
    const computed = calculator ? calculator(average) : Math.round(Math.min(400, average * 1.2));

    if (computed >= finalAqi) {
      finalAqi = computed;
      dominantKey = key;
    }
  });

  return {
    aqi: Math.min(500, Math.max(0, finalAqi)),
    dominantKey,
  };
};

const formatPollutants = (aggregates) => Object.entries(aggregates).reduce((acc, [key, value]) => {
  const label = POLLUTANT_LABELS[key] ?? key.toUpperCase();
  const unit = value?.unit ?? POLLUTANT_UNITS[key] ?? '';
  const average = Number.isFinite(value?.average) ? roundTo(value.average, 1) : null;
  acc[label] = average !== null ? `${average} ${unit}`.trim() : 'No data';
  return acc;
}, {});

const getMostRecentTimestamp = (aggregates) => {
  const timestamps = Object.values(aggregates)
    .map((entry) => entry?.lastUpdated)
    .filter(Boolean)
    .sort((a, b) => (a > b ? -1 : 1));
  return timestamps[0] ?? null;
};

export const clearOpenAqCache = (cityId) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  if (cityId) {
    window.localStorage.removeItem(`${CACHE_PREFIX}:${cityId}`);
    return;
  }

  Object.keys(window.localStorage).forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      window.localStorage.removeItem(key);
    }
  });
};

export const fetchOpenAqCitySnapshot = async (city, {
  ttlMs = DEFAULT_CACHE_TTL_MS,
  fetchImpl,
  signal,
} = {}) => {
  if (!city?.id || !Number.isFinite(city?.lat) || !Number.isFinite(city?.lng)) {
    return null;
  }

  const cacheKey = `${CACHE_PREFIX}:${city.id}`;
  const cached = readCache(cacheKey, ttlMs);
  if (cached) {
    return cached;
  }

  try {
    const measurements = await fetchMeasurements({
      lat: city.lat,
      lng: city.lng,
      fetchImpl,
      signal,
    });

    if (!measurements?.length) {
      return null;
    }

    const aggregates = aggregateMeasurements(measurements);
    const { aqi, dominantKey } = computeAqiFromAggregates(aggregates);
    const dominantPollutant = POLLUTANT_LABELS[dominantKey] ?? (dominantKey ? dominantKey.toUpperCase() : city.dominantPollutant);
    const pollutants = formatPollutants(aggregates);
    const updatedAt = getMostRecentTimestamp(aggregates) ?? new Date().toISOString();

    const snapshot = {
      ...city,
      aqi,
      dominantPollutant,
      pollutants: {
        ...city.pollutants,
        ...pollutants,
      },
      updatedAt,
      metadata: {
        ...city.metadata,
        source: 'openAq',
        lastFetchedAt: new Date().toISOString(),
        dominantKey,
        measurementsCount: measurements.length,
      },
    };

    writeCache(cacheKey, snapshot, ttlMs);
    return snapshot;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[openAqService] failed to fetch measurements', error);
    return null;
  }
};

export const fetchOpenAqCitySnapshots = async (cities, options = {}) => {
  if (!Array.isArray(cities) || cities.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(
    cities.map((city) => fetchOpenAqCitySnapshot(city, options))
  );

  return snapshots.filter(Boolean);
};

const openAqService = {
  fetchOpenAqCitySnapshot,
  fetchOpenAqCitySnapshots,
  clearOpenAqCache,
};

export default openAqService;
