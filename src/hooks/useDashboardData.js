import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePersistentState } from './usePersistentState';
import { getAqiLevel } from '../utils/aqi';

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

const CITY_CATALOG = [
  {
    id: 'delhi',
    name: 'New Delhi',
    country: 'India',
    aqi: 182,
    dominantPollutant: 'PM2.5',
    updated: '12 mins ago',
    trend: 'Rising',
    lat: 28.6139,
    lng: 77.209,
    pollutants: {
      'PM2.5': '182 µg/m³',
      PM10: '98 µg/m³',
      CO: '0.7 ppm',
      NO2: '44 ppb',
      SO2: '12 ppb',
      O3: '23 ppb',
    },
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    aqi: 120,
    dominantPollutant: 'PM10',
    updated: '8 mins ago',
    trend: 'Stable',
    lat: 19.076,
    lng: 72.8777,
    pollutants: {
      'PM2.5': '96 µg/m³',
      PM10: '120 µg/m³',
      CO: '0.4 ppm',
      NO2: '28 ppb',
      SO2: '8 ppb',
      O3: '31 ppb',
    },
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    aqi: 68,
    dominantPollutant: 'NO₂',
    updated: '4 mins ago',
    trend: 'Improving',
    lat: 51.5072,
    lng: -0.1276,
    pollutants: {
      'PM2.5': '34 µg/m³',
      PM10: '50 µg/m³',
      CO: '0.3 ppm',
      NO2: '22 ppb',
      SO2: '4 ppb',
      O3: '19 ppb',
    },
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    aqi: 75,
    dominantPollutant: 'O₃',
    updated: '18 mins ago',
    trend: 'Stable',
    lat: -33.8688,
    lng: 151.2093,
    pollutants: {
      'PM2.5': '38 µg/m³',
      PM10: '52 µg/m³',
      CO: '0.3 ppm',
      NO2: '18 ppb',
      SO2: '5 ppb',
      O3: '37 ppb',
    },
  },
  {
    id: 'san-francisco',
    name: 'San Francisco',
    country: 'USA',
    aqi: 88,
    dominantPollutant: 'PM2.5',
    updated: '6 mins ago',
    trend: 'Rising',
    lat: 37.7749,
    lng: -122.4194,
    pollutants: {
      'PM2.5': '88 µg/m³',
      PM10: '60 µg/m³',
      CO: '0.5 ppm',
      NO2: '25 ppb',
      SO2: '6 ppb',
      O3: '21 ppb',
    },
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    aqi: 94,
    dominantPollutant: 'NO₂',
    updated: '11 mins ago',
    trend: 'Improving',
    lat: 48.8566,
    lng: 2.3522,
    pollutants: {
      'PM2.5': '52 µg/m³',
      PM10: '66 µg/m³',
      CO: '0.4 ppm',
      NO2: '31 ppb',
      SO2: '9 ppb',
      O3: '18 ppb',
    },
  },
];

const DEFAULT_TRACKED_IDS = ['delhi', 'mumbai', 'london'];

const DEFAULT_TRACKED = CITY_CATALOG.filter((city) => DEFAULT_TRACKED_IDS.includes(city.id));

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
      trends: buildTrendData([]),
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

export const useDashboardData = () => {
  const [trackedCities, setTrackedCities] = usePersistentState('aq-tracked-cities', DEFAULT_TRACKED);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timeout);
  }, []);

  const mapCities = useMemo(
    () =>
      trackedCities.map((city) => {
        const level = getAqiLevel(city.aqi);
        return {
          id: city.id,
          name: city.name,
          lat: city.lat,
          lng: city.lng,
          aqi: city.aqi,
          color: AQI_COLOR_HEX[level.color] ?? '#1f4f8b',
        };
      }),
    [trackedCities],
  );

  const removeCity = useCallback((cityId) => {
    setTrackedCities((prev) => prev.filter((city) => city.id !== cityId));
  }, [setTrackedCities]);

  const reorderCity = useCallback(
    (cityId, targetIndex) => {
      setTrackedCities((prev) => {
        const currentIndex = prev.findIndex((city) => city.id === cityId);
        if (currentIndex === -1 || targetIndex < 0 || targetIndex >= prev.length) {
          return prev;
        }
        const newOrder = [...prev];
        const [moved] = newOrder.splice(currentIndex, 1);
        newOrder.splice(targetIndex, 0, moved);
        return newOrder;
      });
    },
    [setTrackedCities],
  );

  const addCity = useCallback(
    (cityId) => {
      const catalogEntry = CITY_CATALOG.find((city) => city.id === cityId);
      if (!catalogEntry) {
        return;
      }

      setTrackedCities((prev) => {
        if (prev.some((existing) => existing.id === catalogEntry.id)) {
          return prev;
        }
        return [...prev, catalogEntry];
      });
    },
    [setTrackedCities],
  );

  const availableCities = useMemo(
    () => CITY_CATALOG.filter((city) => !trackedCities.some((tracked) => tracked.id === city.id)),
    [trackedCities],
  );

  const insights = useMemo(() => calculateInsights(trackedCities), [trackedCities]);

  return {
    trackedCities,
    mapCities,
    availableCities,
    insights,
    isLoading,
    actions: {
      addCity,
      removeCity,
      reorderCity,
    },
  };
};
