import { useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePersistentState } from './usePersistentState';
import { useOpenAqSnapshotCache } from './useOpenAqSnapshotCache';
import { getAqiLevel } from '../utils/aqi';
import { useAuth } from '../context/AuthContext';
import {
  CITY_CATALOG,
  CITY_CATALOG_BY_ID,
} from '../data/cityCatalog';
import {
  fetchDashboardPreferences,
  updateDashboardPreferences,
  fetchCityMetrics,
  searchCities,
  getInitialTrackedCities,
} from '../services/dashboardService';

const AQI_COLOR_HEX = {
  'aqi-good': '#31d17c',
  'aqi-moderate': '#ffce54',
  'aqi-unhealthy': '#ff8a5b',
  'aqi-very-unhealthy': '#d9534f',
  'aqi-hazardous': '#6f1a07',
};

const BADGE_FROM_COLOR = {
  'aqi-good': 'good',
  'aqi-moderate': 'moderate',
  'aqi-unhealthy': 'unhealthy',
  'aqi-very-unhealthy': 'veryUnhealthy',
  'aqi-hazardous': 'hazardous',
};

const getRelativeUpdate = (index) => `${(index * 7) % 47 + 3} mins ago`;

const getTrendLabel = (aqi, index) => {
  if (aqi >= 200) return 'Rising';
  if (aqi <= 75) return 'Improving';
  return ['Stable', 'Rising', 'Improving', 'Volatile'][index % 4] ?? 'Stable';
};

const formatUpdatedLabel = (updatedAt, index) => {
  if (!updatedAt) {
    return getRelativeUpdate(index);
  }

  const timestamp = new Date(updatedAt).getTime();
  if (Number.isNaN(timestamp)) {
    return getRelativeUpdate(index);
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes <= 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

const buildTrendData = (cities) => {
  const baseSeries = [148, 165, 132, 118, 126, 142, 120];
  const averageDelta = cities.reduce((total, city) => total + city.aqi, 0) / Math.max(cities.length, 1);
  const factor = Number.isFinite(averageDelta) ? averageDelta / 150 : 1;
  return baseSeries.map((value, index) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
    aqi: Math.round(value * factor),
  }));
};

const calculateInsights = (cities) => {
  if (cities.length === 0) {
    return {
      summary: [
        {
          title: 'No Cities Tracked',
          value: 'Add a city',
          change: 'Start monitoring now',
          trend: 'neutral',
          badge: 'moderate',
          description: 'Select a city to unlock personalized alerts and insights.',
        },
      ],
      trends: [],
      pollutantLeaders: [],
    };
  }

  const atRiskCities = cities.filter((city) => city.aqi >= 151);
  const averageAqi = Math.round(
    cities.reduce((sum, city) => sum + city.aqi, 0) / Math.max(cities.length, 1),
  );
  const bestCity = [...cities].sort((a, b) => a.aqi - b.aqi)[0];

  const summary = [
    {
      title: 'Cities at Risk',
      value: `${atRiskCities.length}`,
      change: `${cities.length} tracked total`,
      trend: atRiskCities.length > 0 ? 'up' : 'down',
      badge: atRiskCities.length > 0 ? 'unhealthy' : 'good',
      description: atRiskCities.length > 0
        ? 'Take action: limit outdoor activity and enable purifier alerts.'
        : 'All tracked cities currently below critical AQI thresholds.',
    },
    {
      title: 'Average AQI',
      value: `${averageAqi}`,
      change: 'Rolling 24h composite',
      trend: averageAqi > 100 ? 'up' : 'down',
      badge: BADGE_FROM_COLOR[getAqiLevel(averageAqi).color] ?? 'moderate',
      description: 'Helps prioritize where to deploy interventions first.',
    },
    {
      title: 'Cleanest City',
      value: bestCity.name,
      change: `AQI ${bestCity.aqi}`,
      trend: 'neutral',
      badge: BADGE_FROM_COLOR[getAqiLevel(bestCity.aqi).color] ?? 'good',
      description: `${bestCity.name} currently leads your watchlist for best air quality.`,
    },
  ];

  const pollutantLeaders = [...cities]
    .sort((a, b) => b.aqi - a.aqi)
    .slice(0, 4)
    .map((city) => ({ city: city.name, value: city.aqi }));

  return {
    summary,
    trends: buildTrendData(cities),
    pollutantLeaders,
  };
};

const arraysEqual = (left = [], right = []) => {
  if (left === right) return true;
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
};

export const useDashboardData = () => {
  const { user } = useAuth();
  const [trackedCityState, setTrackedCityIds] = usePersistentState(
    'aq-tracked-city-ids',
    getInitialTrackedCities(),
  );
  const trackedCityIds = useMemo(
    () => (Array.isArray(trackedCityState) ? trackedCityState : []),
    [trackedCityState],
  );
  const queryClient = useQueryClient();

  const {
    getCachedSnapshots,
    storeSnapshots,
    pruneExpiredSnapshots,
  } = useOpenAqSnapshotCache();

  const decorateCity = useCallback((city, index) => ({
    ...city,
    updated: formatUpdatedLabel(city.updatedAt, index),
    trend: getTrendLabel(city.aqi, index),
  }), []);

  useEffect(() => {
    pruneExpiredSnapshots();
  }, [pruneExpiredSnapshots]);

  const preferencesKey = useMemo(
    () => ['dashboard-preferences', user?.id ?? 'anonymous'],
    [user?.id],
  );

  const metricsKey = useMemo(
    () => ['dashboard-metrics', trackedCityIds.join('|')],
    [trackedCityIds],
  );

  const preferencesQuery = useQuery({
    queryKey: preferencesKey,
    queryFn: async () => (await fetchDashboardPreferences(user?.id)) ?? { data: null, error: null },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const cachedPlaceholder = useMemo(() => {
    if (!trackedCityIds.length) {
      return [];
    }
    const cachedSnapshots = getCachedSnapshots(trackedCityIds);
    if (!cachedSnapshots.length) {
      return trackedCityIds
        .map((cityId) => CITY_CATALOG_BY_ID[cityId])
        .filter(Boolean);
    }
    const cachedSnapshotMap = new Map(cachedSnapshots.map((snapshot) => [snapshot.id, snapshot]));
    return trackedCityIds
      .map((cityId) => cachedSnapshotMap.get(cityId) ?? CITY_CATALOG_BY_ID[cityId])
      .filter(Boolean);
  }, [getCachedSnapshots, trackedCityIds]);

  const metricsQuery = useQuery({
    queryKey: metricsKey,
    enabled: trackedCityIds.length > 0,
    queryFn: async () => {
      const result = (await fetchCityMetrics(trackedCityIds)) ?? { data: [], error: null };
      if (result.error) {
        const error = new Error(result.error);
        error.fallbackData = result.data ?? [];
        throw error;
      }
      return result.data ?? [];
    },
    placeholderData: cachedPlaceholder,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const preferencesData = preferencesQuery.data?.data ?? null;
  const preferencesError = preferencesQuery.data?.error ?? preferencesQuery.error?.message ?? null;

  const resolvedMetrics = useMemo(() => {
    if (Array.isArray(metricsQuery.data)) {
      return metricsQuery.data;
    }
    if (metricsQuery.error?.fallbackData) {
      return metricsQuery.error.fallbackData;
    }
    return cachedPlaceholder;
  }, [cachedPlaceholder, metricsQuery.data, metricsQuery.error]);

  useEffect(() => {
    if (Array.isArray(resolvedMetrics) && resolvedMetrics.length) {
      storeSnapshots(resolvedMetrics);
    }
  }, [resolvedMetrics, storeSnapshots]);

  useEffect(() => {
    if (!preferencesData?.trackedCityIds?.length) {
      return;
    }
    setTrackedCityIds((prev) => (
      arraysEqual(prev, preferencesData.trackedCityIds)
        ? prev
        : preferencesData.trackedCityIds
    ));
  }, [preferencesData?.trackedCityIds, setTrackedCityIds]);

  const updatePreferencesMutation = useMutation({
    mutationFn: ({ trackedCityIds: nextTrackedIds, favorites }) =>
      updateDashboardPreferences({
        userId: user?.id,
        trackedCityIds: nextTrackedIds,
        favorites,
      }),
    onError: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKey });
    },
  });

  const persistPreferences = useCallback(
    async (nextTrackedIds, options = {}) => {
      const deduped = Array.from(new Set(nextTrackedIds));
      setTrackedCityIds(deduped);

      queryClient.setQueryData(preferencesKey, (previous) => {
        const fallback = previous?.data ?? {
          trackedCityIds: deduped,
          favorites: preferencesData?.favorites ?? [],
        };
        return {
          data: {
            ...fallback,
            trackedCityIds: deduped,
          },
          error: null,
        };
      });

      if (options.skipSync) {
        return;
      }

      await updatePreferencesMutation.mutateAsync({
        trackedCityIds: deduped,
        favorites: preferencesData?.favorites ?? [],
      });
    },
    [preferencesData?.favorites, preferencesKey, queryClient, setTrackedCityIds, updatePreferencesMutation],
  );

  const removeCity = useCallback((cityId) => {
    const next = trackedCityIds.filter((id) => id !== cityId);
    if (next.length === trackedCityIds.length) {
      return;
    }
    persistPreferences(next);
  }, [persistPreferences, trackedCityIds]);

  const reorderCity = useCallback(
    (cityId, targetIndex) => {
      const currentIndex = trackedCityIds.findIndex((id) => id === cityId);
      if (currentIndex === -1 || targetIndex < 0 || targetIndex >= trackedCityIds.length) {
        return;
      }

      const next = [...trackedCityIds];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);
      persistPreferences(next);
    },
    [persistPreferences, trackedCityIds],
  );

  const addCity = useCallback(
    (cityId) => {
      if (!CITY_CATALOG_BY_ID[cityId]) {
        return;
      }

      if (trackedCityIds.includes(cityId)) {
        return;
      }

      persistPreferences([...trackedCityIds, cityId]);
    },
    [persistPreferences, trackedCityIds],
  );

  const trackedCitySet = useMemo(() => new Set(trackedCityIds), [trackedCityIds]);

  const availableCities = useMemo(
    () => CITY_CATALOG.filter((city) => !trackedCitySet.has(city.id)),
    [trackedCitySet],
  );

  const metricsMap = useMemo(
    () => new Map(resolvedMetrics.map((city) => [city.id, city])),
    [resolvedMetrics],
  );

  const mapCities = useMemo(
    () =>
      CITY_CATALOG.map((catalogCity) => {
        const metric = metricsMap.get(catalogCity.id);
        const merged = metric
          ? {
              ...catalogCity,
              ...metric,
              pollutants: metric.pollutants ?? catalogCity.pollutants,
              dominantPollutant: metric.dominantPollutant ?? catalogCity.dominantPollutant,
            }
          : catalogCity;
        const level = getAqiLevel(merged.aqi);
        return {
          id: merged.id,
          name: merged.name,
          lat: merged.lat,
          lng: merged.lng,
          aqi: merged.aqi,
          color: AQI_COLOR_HEX[level.color] ?? '#1f4f8b',
          dominantPollutant: merged.dominantPollutant,
          pollutants: merged.pollutants,
          isTracked: trackedCitySet.has(merged.id),
          updatedAt: merged.updatedAt ?? null,
        };
      }),
    [metricsMap, trackedCitySet],
  );

  const decoratedTrackedCities = useMemo(() => {
    return trackedCityIds
      .map((cityId, index) => {
        const base = metricsMap.get(cityId) ?? CITY_CATALOG_BY_ID[cityId];
        if (!base) {
          return null;
        }
        return decorateCity(base, index);
      })
      .filter(Boolean);
  }, [decorateCity, metricsMap, trackedCityIds]);

  const insights = useMemo(() => calculateInsights(decoratedTrackedCities), [decoratedTrackedCities]);

  const searchCatalog = useCallback((query) => searchCities(query), []);

  return {
    trackedCities: decoratedTrackedCities,
    mapCities,
    availableCities,
    insights,
    isLoading: preferencesQuery.isLoading || metricsQuery.isPending,
    isFetching: metricsQuery.isFetching,
    error: metricsQuery.error?.message ?? preferencesError,
    actions: {
      addCity,
      removeCity,
      reorderCity,
      searchCatalog,
    },
  };
};
