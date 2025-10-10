import { supabase, hasSupabaseCredentials } from './supabaseClient';
import {
  CITY_CATALOG_BY_ID,
  DEFAULT_TRACKED_CITY_IDS,
  CITY_CATALOG,
} from '../data/cityCatalog';
import { fetchOpenAqCitySnapshots } from './openAqService';
import { upsertOpenAqSnapshots } from './openAqIngestionService';

const DASHBOARD_PREFS_TABLE = 'dashboard_preferences';
const CITY_METRICS_TABLE = 'city_aqi_metrics';
const LOCAL_CACHE_KEY = 'aqt::citizen-dashboard-cache@v1';

const withFallback = async (fn, fallback) => {
  try {
    const result = await fn();
    if (result?.error) {
      // eslint-disable-next-line no-console
      console.warn('[dashboardService] remote error', result.error);
      return { data: fallback, error: result.error };
    }
    return { data: result?.data ?? fallback, error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[dashboardService] unexpected error', error);
    return { data: fallback, error: error.message };
  }
};

const readLocalCache = () => {
  try {
    const cached = window.localStorage.getItem(LOCAL_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null;
  }
};

const writeLocalCache = (payload) => {
  try {
    window.localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    // noop
  }
};

export const getInitialTrackedCities = () => {
  const cached = readLocalCache();
  return cached?.trackedCityIds ?? DEFAULT_TRACKED_CITY_IDS;
};

export const fetchDashboardPreferences = async (userId) => withFallback(
  async () => {
    if (!userId || !hasSupabaseCredentials) {
      return { data: { trackedCityIds: getInitialTrackedCities(), favorites: [] } };
    }

    const { data, error } = await supabase
      .from(DASHBOARD_PREFS_TABLE)
      .select('tracked_city_ids, favorite_city_ids, last_synced_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }

    const payload = {
      trackedCityIds: data?.tracked_city_ids?.length ? data.tracked_city_ids : getInitialTrackedCities(),
      favorites: data?.favorite_city_ids ?? [],
      lastSyncedAt: data?.last_synced_at ?? null,
    };

    writeLocalCache(payload);
    return { data: payload };
  },
  { trackedCityIds: getInitialTrackedCities(), favorites: [], lastSyncedAt: null },
);

export const updateDashboardPreferences = async ({ userId, trackedCityIds, favorites }) => {
  const payload = {
    tracked_city_ids: trackedCityIds,
    favorite_city_ids: favorites ?? [],
  };

  writeLocalCache({ trackedCityIds, favorites: payload.favorite_city_ids });

  if (!userId || !hasSupabaseCredentials) {
    return { data: payload };
  }

  const { error } = await supabase
    .from(DASHBOARD_PREFS_TABLE)
    .upsert({
      user_id: userId,
      tracked_city_ids: trackedCityIds,
      favorite_city_ids: payload.favorite_city_ids,
    });

  return { error: error?.message ?? null, data: payload };
};

export const fetchCityMetrics = async (cityIds = []) => withFallback(
  async () => {
    if (!cityIds.length) {
      return { data: [] };
    }

    const catalogCities = cityIds
      .map((cityId) => CITY_CATALOG_BY_ID[cityId])
      .filter(Boolean);

    const openAqSnapshots = catalogCities.length
      ? await fetchOpenAqCitySnapshots(catalogCities)
      : [];

    if (openAqSnapshots.length && hasSupabaseCredentials) {
      await upsertOpenAqSnapshots(openAqSnapshots);
    }

    if (!hasSupabaseCredentials) {
      const snapshotMap = new Map(openAqSnapshots.map((snapshot) => [snapshot.id, snapshot]));

      return {
        data: cityIds
          .map((cityId) => snapshotMap.get(cityId) ?? CITY_CATALOG_BY_ID[cityId])
          .filter(Boolean),
      };
    }

    const { data, error } = await supabase
      .from(CITY_METRICS_TABLE)
      .select('city_id, aqi, dominant_pollutant, pollutants, updated_at')
      .in('city_id', cityIds);

    if (error) {
      return { error: error.message };
    }

    const snapshotMap = new Map(openAqSnapshots.map((snapshot) => [snapshot.id, snapshot]));

    return {
      data: cityIds.map((cityId) => {
        const remoteMetrics = data?.find((row) => row.city_id === cityId);
        const catalogCity = CITY_CATALOG_BY_ID[cityId];
        const snapshot = snapshotMap.get(cityId);

        if (!catalogCity) {
          return null;
        }

        return {
          ...catalogCity,
          aqi: remoteMetrics?.aqi ?? snapshot?.aqi ?? catalogCity.aqi,
          dominantPollutant: remoteMetrics?.dominant_pollutant ?? snapshot?.dominantPollutant ?? catalogCity.dominantPollutant,
          pollutants: remoteMetrics?.pollutants ?? snapshot?.pollutants ?? catalogCity.pollutants,
          updatedAt: remoteMetrics?.updated_at ?? snapshot?.updatedAt ?? null,
        };
      }).filter(Boolean),
    };
  },
  cityIds
    .map((cityId) => CITY_CATALOG_BY_ID[cityId])
    .filter(Boolean),
);

export const searchCities = (query) => {
  if (!query) {
    return CITY_CATALOG.slice(0, 25);
  }

  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);

  return CITY_CATALOG.filter((city) =>
    keywords.every((keyword) =>
      city.name.toLowerCase().includes(keyword)
      || city.country.toLowerCase().includes(keyword)
      || city.region.toLowerCase().includes(keyword)
    ),
  ).slice(0, 50);
};

export const syncCityMetrics = async ({ cityId, metrics }) => {
  if (!cityId || !metrics) {
    return { error: 'cityId and metrics are required.' };
  }

  const catalogCity = CITY_CATALOG_BY_ID[cityId];

  if (!catalogCity) {
    return { error: `Unknown city: ${cityId}` };
  }

  if (!hasSupabaseCredentials) {
    return { error: null };
  }

  const payload = {
    city_id: cityId,
    aqi: metrics.aqi ?? catalogCity.aqi,
    dominant_pollutant: metrics.dominantPollutant ?? catalogCity.dominantPollutant,
    pollutants: metrics.pollutants ?? catalogCity.pollutants,
  };

  const { error } = await supabase
    .from(CITY_METRICS_TABLE)
    .upsert(payload, { onConflict: 'city_id' });

  return { error: error?.message ?? null };
};

export const clearLocalDashboardCache = () => {
  try {
    window.localStorage.removeItem(LOCAL_CACHE_KEY);
  } catch (error) {
    // noop
  }
};
