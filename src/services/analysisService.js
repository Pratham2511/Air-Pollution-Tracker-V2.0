import { supabase, hasSupabaseCredentials } from './supabaseClient';
import {
  ANALYSIS_WINDOWS,
  normalizeAnalysisWindow,
  buildMultiCityFallback,
} from './analysisFallback';
import { buildCityAnalysisOffthread } from './analysisWorkerClient';

export { ANALYSIS_WINDOWS, normalizeAnalysisWindow };

const withSupabaseFallback = async (queryFn, fallbackBuilder) => {
  if (!hasSupabaseCredentials) {
    return { data: await fallbackBuilder(), error: null, source: 'fallback' };
  }

  try {
    const { data, error } = await queryFn();
    if (error || !data) {
      return { data: await fallbackBuilder(), error, source: 'fallback' };
    }
    return { data, error: null, source: 'supabase' };
  } catch (error) {
    return { data: await fallbackBuilder(), error, source: 'fallback' };
  }
};

export const fetchCityAnalysis = async ({ cityId, window: requestedWindow = '7d' }) => {
  const windowKey = normalizeAnalysisWindow(requestedWindow);
  return withSupabaseFallback(
    () => supabase.rpc('get_city_analysis', { city_id: cityId, range_window: windowKey }),
    () => buildCityAnalysisOffthread(cityId, windowKey),
  );
};

export const fetchMultiCityOverview = async ({ cityIds, window: requestedWindow = '7d' } = {}) => {
  const windowKey = normalizeAnalysisWindow(requestedWindow);
  return withSupabaseFallback(
    () => supabase.rpc('get_multi_city_overview', { city_ids: cityIds ?? null, range_window: windowKey }),
    () => buildMultiCityFallback(cityIds, windowKey),
  );
};

export const fetchCityForecastSummary = async ({ cityId, window: requestedWindow = '7d' }) => {
  const windowKey = normalizeAnalysisWindow(requestedWindow);
  return withSupabaseFallback(
    () => supabase.rpc('get_city_forecast', { city_id: cityId, range_window: windowKey }),
    async () => {
      const fallback = await buildCityAnalysisOffthread(cityId, windowKey);
      return {
        city: fallback.city,
        trendSeries: fallback.trendSeries,
        forecast: fallback.forecast,
        meta: fallback.meta,
      };
    },
  );
};
