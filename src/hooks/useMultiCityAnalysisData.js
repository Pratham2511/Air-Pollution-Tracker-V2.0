import { useState, useEffect, useMemo, useCallback } from 'react';
import { CITY_CATALOG, CITY_CATALOG_BY_ID } from '../data/cityCatalog';
import { getAqiLevel } from '../utils/aqi';
import { fetchMultiCityOverview, normalizeAnalysisWindow, ANALYSIS_WINDOWS } from '../services/analysisService';

const DEFAULT_WINDOW = '7d';
const DEFAULT_CITY_IDS = CITY_CATALOG.slice(0, 6).map((city) => city.id);

export const useMultiCityAnalysisData = (initialCityIds = DEFAULT_CITY_IDS, options = {}) => {
  const initialWindow = normalizeAnalysisWindow(options.initialWindow ?? DEFAULT_WINDOW);
  const [windowKey, setWindowKey] = useState(initialWindow);
  const [selectedCityIds, setSelectedCityIds] = useState(
    initialCityIds.length ? initialCityIds : DEFAULT_CITY_IDS,
  );
  const [status, setStatus] = useState('idle');
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('fallback');
  const [lastFetched, setLastFetched] = useState(null);

  const load = useCallback(
    async (cityIdsToFetch = selectedCityIds, nextWindow = windowKey) => {
      if (!cityIdsToFetch.length) {
        setOverview(null);
        setError({ message: 'Select at least one city to build analysis.' });
        setStatus('error');
        return;
      }

      setStatus('loading');
      const result = await fetchMultiCityOverview({ cityIds: cityIdsToFetch, window: nextWindow });

      if (!result.data) {
        setOverview(null);
        setError(result.error ?? { message: 'Unable to load multi-city overview.' });
        setStatus('error');
        setSource('fallback');
        return;
      }

      setOverview(result.data);
      setSource(result.source ?? 'fallback');
      setError(result.error && result.source === 'supabase' ? result.error : null);
      setStatus('success');
      setLastFetched(Date.now());
    },
    [selectedCityIds, windowKey],
  );

  useEffect(() => {
    load(selectedCityIds, windowKey);
  }, [load, selectedCityIds, windowKey]);

  const changeWindow = useCallback((nextWindow) => {
    setWindowKey(normalizeAnalysisWindow(nextWindow));
  }, []);

  const refresh = useCallback(() => {
    load(selectedCityIds, windowKey);
  }, [load, selectedCityIds, windowKey]);

  const setCities = useCallback((nextCityIds) => {
    const uniqueIds = Array.from(new Set(nextCityIds.filter((id) => CITY_CATALOG_BY_ID[id])));
    setSelectedCityIds(uniqueIds.length ? uniqueIds : DEFAULT_CITY_IDS);
  }, []);

  const toggleCity = useCallback((cityId) => {
    setSelectedCityIds((prev) => {
      if (prev.includes(cityId)) {
        const filtered = prev.filter((id) => id !== cityId);
        return filtered.length ? filtered : prev;
      }
      return [...prev, cityId];
    });
  }, []);

  const matrixSource = overview?.matrix;

  const matrix = useMemo(
    () => (Array.isArray(matrixSource) ? matrixSource : []),
    [matrixSource],
  );

  const hotspots = useMemo(
    () => [...matrix].sort((a, b) => b.aqi - a.aqi).slice(0, 5),
    [matrix],
  );

  const healthierCities = useMemo(
    () => [...matrix].sort((a, b) => a.aqi - b.aqi).slice(0, 5),
    [matrix],
  );

  const dominantPollutants = useMemo(
    () =>
      matrix.map((entry) => ({
        cityId: entry.cityId,
        cityName: entry.cityName,
        pollutant: entry.dominantPollutant,
        level: getAqiLevel(entry.aqi),
      })),
    [matrix],
  );

  const availableCities = useMemo(
    () => CITY_CATALOG.filter((city) => !selectedCityIds.includes(city.id)),
    [selectedCityIds],
  );

  return {
    status,
    isLoading: status === 'loading',
    overview,
    error,
    source,
    window: windowKey,
    availableWindows: ANALYSIS_WINDOWS,
    selectedCityIds,
    lastFetched,
    hotspots,
    healthiest: healthierCities,
    dominantPollutants,
    availableCities,
    actions: {
      setWindow: changeWindow,
      refresh,
      setSelectedCityIds: setCities,
      toggleCity,
    },
  };
};

export default useMultiCityAnalysisData;
