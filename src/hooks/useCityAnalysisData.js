import { useState, useEffect, useMemo, useCallback } from 'react';
import { CITY_CATALOG_BY_ID } from '../data/cityCatalog';
import { getAqiLevel } from '../utils/aqi';
import { fetchCityAnalysis, normalizeAnalysisWindow, ANALYSIS_WINDOWS } from '../services/analysisService';

const DEFAULT_WINDOW = '7d';

export const useCityAnalysisData = (cityId, options = {}) => {
  const initialWindow = normalizeAnalysisWindow(options.initialWindow ?? DEFAULT_WINDOW);
  const [windowKey, setWindowKey] = useState(initialWindow);
  const [status, setStatus] = useState('idle');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('fallback');
  const [lastFetched, setLastFetched] = useState(null);

  const city = cityId ? CITY_CATALOG_BY_ID[cityId] ?? null : null;

  const load = useCallback(
    async (nextWindow = windowKey) => {
      if (!cityId) {
        setAnalysis(null);
        setError({ message: 'City identifier is required for analysis.' });
        setStatus('error');
        return;
      }

      setStatus('loading');
      const result = await fetchCityAnalysis({ cityId, window: nextWindow });

      if (!result.data) {
        setStatus('error');
        setError(result.error ?? { message: 'Unable to load analysis data.' });
        setAnalysis(null);
        setSource('fallback');
        return;
      }

      setAnalysis(result.data);
      setSource(result.source ?? 'fallback');
      setError(result.error && result.source === 'supabase' ? result.error : null);
      setStatus('success');
      setLastFetched(Date.now());
    },
    [cityId, windowKey],
  );

  useEffect(() => {
    load(windowKey);
  }, [load, windowKey]);

  const changeWindow = useCallback((nextWindow) => {
    setWindowKey(normalizeAnalysisWindow(nextWindow));
  }, []);

  const refresh = useCallback(() => {
    load(windowKey);
  }, [load, windowKey]);

  const latestPoint = useMemo(() => analysis?.trendSeries?.[analysis.trendSeries.length - 1] ?? null, [analysis]);

  const dominantPollutant = useMemo(
    () => analysis?.pollutantBreakdown?.[0] ?? null,
    [analysis],
  );

  const riskLevel = useMemo(() => {
    if (latestPoint?.aqi) {
      return getAqiLevel(latestPoint.aqi);
    }
    if (city?.aqi) {
      return getAqiLevel(city.aqi);
    }
    return getAqiLevel(0);
  }, [latestPoint?.aqi, city?.aqi]);

  const highlightMetrics = useMemo(() => ({
    currentAqi: latestPoint?.aqi ?? city?.aqi ?? null,
    trendDirection: analysis?.comparisons?.direction ?? 'flat',
    avgComparisonDelta: analysis?.comparisons?.delta ?? 0,
    criticalHours: analysis?.comparisons?.criticalHours ?? 0,
    advisoryTriggers: analysis?.comparisons?.advisoryTriggers ?? 0,
  }), [analysis?.comparisons, latestPoint?.aqi, city?.aqi]);

  return {
    status,
    isLoading: status === 'loading',
    error,
    source,
    analysis,
    city,
    window: windowKey,
    availableWindows: ANALYSIS_WINDOWS,
    lastFetched,
    latestPoint,
    dominantPollutant,
    riskLevel,
    highlightMetrics,
    actions: {
      setWindow: changeWindow,
      refresh,
    },
  };
};

export default useCityAnalysisData;
