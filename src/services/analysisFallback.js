import { CITY_CATALOG, CITY_CATALOG_BY_ID } from '../data/cityCatalog';
import { getAqiLevel } from '../utils/aqi';

export const ANALYSIS_WINDOWS = ['24h', '7d', '30d'];

const POLLUTANTS = ['PM2.5', 'PM10', 'NO₂', 'SO₂', 'CO', 'O₃'];

const RANGE_CONFIG = {
  '24h': { points: 24, stepMs: 60 * 60 * 1000 },
  '7d': { points: 7, stepMs: 24 * 60 * 60 * 1000 },
  '30d': { points: 30, stepMs: 24 * 60 * 60 * 1000 },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const createSeededRandom = (seedValue = '') => {
  const seedString = String(seedValue);
  let hash = 0;
  for (let index = 0; index < seedString.length; index += 1) {
    hash = (hash << 5) - hash + seedString.charCodeAt(index);
    hash |= 0; // eslint-disable-line no-bitwise
  }
  let seed = Math.abs(hash) % 2147483647;
  if (seed === 0) {
    seed = 2147483646;
  }
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};

export const normalizeAnalysisWindow = (value) => (ANALYSIS_WINDOWS.includes(value) ? value : '7d');

const resolveCity = (cityId) => CITY_CATALOG_BY_ID[cityId] ?? CITY_CATALOG[0];

export const generateTrendSeries = (city, windowKey) => {
  const config = RANGE_CONFIG[windowKey];
  const random = createSeededRandom(`${city.id}-${windowKey}-trend`);
  const now = Date.now();
  const baseAqi = city?.aqi ?? 120;

  return Array.from({ length: config.points }, (_, index) => {
    const seasonal = Math.sin((index / config.points) * Math.PI * 2) * 18;
    const noise = (random() - 0.5) * 40;
    const aqi = clamp(Math.round(baseAqi + seasonal + noise), 20, 420);
    const rollingAvg = clamp(Math.round((aqi + baseAqi) / 2 + (random() - 0.5) * 10), 20, 400);
    const timestamp = new Date(now - (config.points - index) * config.stepMs).toISOString();

    return {
      timestamp,
      aqi,
      rollingAvg,
    };
  });
};

export const generateForecastSeries = (city, windowKey, latestAqi) => {
  const random = createSeededRandom(`${city.id}-${windowKey}-forecast`);
  const stepMs = RANGE_CONFIG[windowKey].stepMs;
  const now = Date.now();
  const base = latestAqi ?? city?.aqi ?? 120;

  const shortTerm = Array.from({ length: 6 }, (_, index) => {
    const delta = (random() - 0.5) * 24 - index * 1.5;
    return {
      timestamp: new Date(now + ((index + 1) * stepMs) / (windowKey === '24h' ? 6 : 3)).toISOString(),
      projectedAqi: clamp(Math.round(base + delta), 20, 420),
    };
  });

  const longTerm = Array.from({ length: 5 }, (_, index) => {
    const seasonal = Math.cos((index / 5) * Math.PI) * 20;
    const drift = (random() - 0.5) * 35 - index * 2;
    return {
      timestamp: new Date(now + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      projectedAqi: clamp(Math.round(base + seasonal + drift), 20, 420),
    };
  });

  return { shortTerm, longTerm };
};

export const generatePollutantBreakdown = (city, windowKey) => {
  const random = createSeededRandom(`${city.id}-${windowKey}-pollutants`);
  const baseline = clamp(city?.aqi ?? 110, 40, 380);

  const distribution = POLLUTANTS.map((pollutant, index) => {
    const weight = (random() + index * 0.12) * (baseline / (index + 2));
    return {
      pollutant,
      value: Number(clamp(weight, 6, 180).toFixed(1)),
      unit: 'µg/m³',
    };
  }).sort((a, b) => b.value - a.value);

  return distribution.map((entry, index) => ({
    ...entry,
    dominance: index === 0 ? 'primary' : index === 1 ? 'secondary' : 'minor',
  }));
};

const generateHealthAdvisories = (city, level) => {
  const advisoriesByLevel = {
    'aqi-good': [
      {
        severity: 'low',
        headline: 'Air quality is healthy',
        description: 'Outdoor activities are encouraged. Share clean air alerts with the community.',
        actions: ['Continue routine monitoring', 'Log baseline sensor readings'],
      },
    ],
    'aqi-moderate': [
      {
        severity: 'moderate',
        headline: 'Sensible precautions advised',
        description: 'Sensitive groups may experience mild symptoms. Keep hydration points ready.',
        actions: ['Notify hospitals of moderate AQI', 'Advise masks for vulnerable groups'],
      },
    ],
    'aqi-unhealthy': [
      {
        severity: 'high',
        headline: 'Unhealthy conditions detected',
        description: 'AQI exceeds safe thresholds. Trigger outdoor activity advisories.',
        actions: ['Activate public alerts', 'Deploy mobile air quality sensors', 'Coordinate with traffic control'],
      },
      {
        severity: 'medium',
        headline: 'Track respirable pollutant spikes',
        description: 'Respirable particles are elevated. Prepare support for respiratory clinics.',
        actions: ['Distribute N95 masks to schools', 'Extend clinic hours for respiratory cases'],
      },
    ],
    'aqi-very-unhealthy': [
      {
        severity: 'very-high',
        headline: 'Severe air quality emergency',
        description: 'AQI levels require immediate mitigation. Initiate emergency playbooks.',
        actions: ['Enforce traffic restrictions', 'Activate emergency operations center', 'Broadcast stay-indoors guidance'],
      },
      {
        severity: 'high',
        headline: 'Coordinate inter-agency response',
        description: 'Sustained high AQI requires multi-agency coordination for rapid response.',
        actions: ['Schedule hourly command briefings', 'Deploy mobile filtration units'],
      },
    ],
    'aqi-hazardous': [
      {
        severity: 'critical',
        headline: 'Hazardous conditions persisting',
        description: 'Population exposure is critical. Initiate shelter-in-place advisories.',
        actions: ['Issue emergency broadcast alerts', 'Deploy rapid response teams', 'Monitor hospital intake capacity'],
      },
      {
        severity: 'very-high',
        headline: 'Emergency relief activation',
        description: 'Coordinate relief logistics and ensure vulnerable populations receive support.',
        actions: ['Distribute air purifiers to relief centers', 'Authorize emergency funding releases'],
      },
    ],
  };

  const levelKey = level?.color ?? 'aqi-moderate';
  return advisoriesByLevel[levelKey] ?? advisoriesByLevel['aqi-moderate'];
};

const generateSourceAttribution = (city, windowKey) => {
  const random = createSeededRandom(`${city.id}-${windowKey}-sources`);
  const categories = [
    { source: 'Vehicular Emissions', impact: 'transportation corridors' },
    { source: 'Industrial Output', impact: 'adjacent industrial estates' },
    { source: 'Construction Dust', impact: 'urban development zones' },
    { source: 'Agricultural Burning', impact: 'regional crop residue burning' },
    { source: 'Household Fuel', impact: 'domestic solid fuel usage' },
  ];

  return categories
    .map((entry) => ({
      ...entry,
      confidence: Number((0.4 + random() * 0.5).toFixed(2)),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4);
};

const generateWeatherCorrelation = (city, windowKey) => {
  const random = createSeededRandom(`${city.id}-${windowKey}-correlation`);
  return [
    { metric: 'temperature', correlation: Number(((random() * 1.6) - 0.8).toFixed(2)) },
    { metric: 'humidity', correlation: Number(((random() * 1.6) - 0.8).toFixed(2)) },
    { metric: 'windSpeed', correlation: Number(((random() * 1.6) - 0.8).toFixed(2)) },
    { metric: 'precipitation', correlation: Number(((random() * 1.6) - 0.8).toFixed(2)) },
    { metric: 'surfacePressure', correlation: Number(((random() * 1.6) - 0.8).toFixed(2)) },
  ];
};

export const generateComparisons = (trendSeries, windowKey) => {
  if (!trendSeries.length) {
    return {
      currentAverage: 0,
      previousAverage: 0,
      delta: 0,
      direction: 'flat',
      criticalHours: 0,
      advisoryTriggers: 0,
    };
  }

  const recentWindowSize = windowKey === '24h' ? 6 : Math.max(3, Math.round(trendSeries.length / 4));
  const previousWindowSize = Math.min(trendSeries.length - recentWindowSize, recentWindowSize * 2);

  const currentSlice = trendSeries.slice(-recentWindowSize);
  const previousSlice = trendSeries.slice(-(recentWindowSize + previousWindowSize), -recentWindowSize);

  const currentAverage = Math.round(
    currentSlice.reduce((sum, point) => sum + point.aqi, 0) / Math.max(currentSlice.length, 1),
  );
  const previousAverage = Math.round(
    previousSlice.reduce((sum, point) => sum + point.aqi, 0) / Math.max(previousSlice.length, 1),
  );
  const delta = currentAverage - previousAverage;
  const direction = delta === 0 ? 'flat' : delta > 0 ? 'rising' : 'improving';
  const criticalHours = currentSlice.filter((point) => point.aqi >= 200).length;
  const advisoryTriggers = currentSlice.filter((point) => point.aqi >= 150).length;

  return {
    currentAverage,
    previousAverage,
    delta,
    direction,
    criticalHours,
    advisoryTriggers,
  };
};

export const generateExposureMetrics = (city, trendSeries) => {
  if (!trendSeries.length) {
    return {
      estimatedPopulation: 0,
      aqiLoadIndex: 0,
      exposureHours: 0,
    };
  }

  const estimatedPopulation = 150000 + (city.population ?? 0) * 0.15; // fallback for missing population
  const aqiLoadIndex = Math.round(
    trendSeries.reduce((sum, point) => sum + point.aqi, 0) / trendSeries.length,
  );
  const exposureHours = trendSeries.filter((point) => point.aqi >= 150).length * (trendSeries.length >= 24 ? 1 : 4);

  return {
    estimatedPopulation: Math.round(estimatedPopulation),
    aqiLoadIndex,
    exposureHours,
  };
};

export const buildCityAnalysisFallback = (cityId, windowKey) => {
  const city = resolveCity(cityId);
  const trendSeries = generateTrendSeries(city, windowKey);
  const latest = trendSeries[trendSeries.length - 1];
  const forecast = generateForecastSeries(city, windowKey, latest?.aqi);
  const breakdown = generatePollutantBreakdown(city, windowKey);
  const level = getAqiLevel(latest?.aqi ?? city?.aqi);

  return {
    city: {
      id: city.id,
      name: city.name,
      state: city.state,
      country: city.country,
      coordinates: { lat: city.lat, lng: city.lng },
    },
    trendSeries,
    forecast,
    pollutantBreakdown: breakdown,
    healthAdvisories: generateHealthAdvisories(city, level),
    sourceAttribution: generateSourceAttribution(city, windowKey),
    weatherCorrelations: generateWeatherCorrelation(city, windowKey),
    comparisons: generateComparisons(trendSeries, windowKey),
    exposure: generateExposureMetrics(city, trendSeries),
    meta: {
      window: windowKey,
      generatedAt: new Date().toISOString(),
      level,
    },
  };
};

export const buildMultiCityFallback = (cityIds, windowKey) => {
  const selectedCities = (cityIds?.length ? cityIds : CITY_CATALOG.slice(0, 6).map((city) => city.id))
    .map((id) => CITY_CATALOG_BY_ID[id])
    .filter(Boolean);

  const cities = selectedCities.length ? selectedCities : CITY_CATALOG.slice(0, 6);

  const citySnapshots = cities.map((city) => {
    const random = createSeededRandom(`${city.id}-${windowKey}-matrix`);
    const change = Math.round((random() - 0.5) * 40);
    const currentAqi = clamp(Math.round((city.aqi ?? 120) + change), 20, 420);
    const breakdown = generatePollutantBreakdown(city, windowKey);

    return {
      cityId: city.id,
      cityName: city.name,
      aqi: currentAqi,
      change,
      level: getAqiLevel(currentAqi),
      dominantPollutant: breakdown[0]?.pollutant ?? 'PM2.5',
      pollutantBreakdown: breakdown,
      population: Math.round(180000 + random() * 250000),
      lastUpdated: new Date(Date.now() - Math.round(random() * 6) * 60 * 60 * 1000).toISOString(),
      riskScore: Number((random() * 9 + 1).toFixed(1)),
    };
  });

  const improving = [...citySnapshots]
    .sort((a, b) => a.change - b.change)
    .slice(0, Math.min(4, citySnapshots.length))
    .map((snapshot) => ({
      cityId: snapshot.cityId,
      cityName: snapshot.cityName,
      delta: snapshot.change,
      currentAqi: snapshot.aqi,
      level: snapshot.level,
    }));

  const deteriorating = [...citySnapshots]
    .sort((a, b) => b.change - a.change)
    .slice(0, Math.min(4, citySnapshots.length))
    .map((snapshot) => ({
      cityId: snapshot.cityId,
      cityName: snapshot.cityName,
      delta: snapshot.change,
      currentAqi: snapshot.aqi,
      level: snapshot.level,
    }));

  const pollutantMatrix = citySnapshots.map((snapshot) => ({
    cityId: snapshot.cityId,
    cityName: snapshot.cityName,
    pollutants: snapshot.pollutantBreakdown.map((entry) => ({
      pollutant: entry.pollutant,
      value: entry.value,
    })),
  }));

  const correlationInsights = citySnapshots.map((snapshot) => {
    const random = createSeededRandom(`${snapshot.cityId}-${windowKey}-corr-matrix`);
    return {
      cityId: snapshot.cityId,
      cityName: snapshot.cityName,
      correlations: {
        temperature: Number(((random() * 1.6) - 0.8).toFixed(2)),
        humidity: Number(((random() * 1.6) - 0.8).toFixed(2)),
        windSpeed: Number(((random() * 1.6) - 0.8).toFixed(2)),
        precipitation: Number(((random() * 1.6) - 0.8).toFixed(2)),
      },
    };
  });

  const totalAqi = citySnapshots.reduce((sum, snapshot) => sum + snapshot.aqi, 0);
  const averageAqi = Math.round(totalAqi / Math.max(citySnapshots.length, 1));
  const hazardousCount = citySnapshots.filter((snapshot) => snapshot.aqi >= 200).length;

  const temporalRandom = createSeededRandom(`temporal-${windowKey}-${citySnapshots.length}`);
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    averageAqi: clamp(
      Math.round(
        averageAqi + Math.sin((hour / 24) * Math.PI * 2) * 18 + (temporalRandom() - 0.5) * 20,
      ),
      20,
      420,
    ),
  }));

  const weekly = Array.from({ length: 7 }, (_, index) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
    averageAqi: clamp(
      Math.round(
        averageAqi + Math.cos((index / 7) * Math.PI * 2) * 22 + (temporalRandom() - 0.5) * 18,
      ),
      20,
      420,
    ),
  }));

  const cumulativeImpact = {
    averageAqi,
    hazardousHours: hazardousCount * 6,
    alertsIssued: hazardousCount * 2 + Math.round((citySnapshots.length - hazardousCount) * 0.6),
    populationExposed: citySnapshots.reduce((sum, snapshot) => sum + snapshot.population * (snapshot.aqi / 500), 0),
  };

  return {
    matrix: citySnapshots,
    pollutantMatrix,
    trendLeaders: { improving, deteriorating },
    correlationInsights,
    temporalPatterns: { hourly, weekly },
    cumulativeImpact: {
      ...cumulativeImpact,
      populationExposed: Math.round(cumulativeImpact.populationExposed),
    },
    meta: {
      window: windowKey,
      generatedAt: new Date().toISOString(),
      cityCount: citySnapshots.length,
    },
  };
};
