export const AQI_LEVELS = [
  { threshold: 50, label: 'Good', color: 'aqi-good' },
  { threshold: 100, label: 'Moderate', color: 'aqi-moderate' },
  { threshold: 200, label: 'Unhealthy', color: 'aqi-unhealthy' },
  { threshold: 300, label: 'Very Unhealthy', color: 'aqi-very-unhealthy' },
  { threshold: Infinity, label: 'Hazardous', color: 'aqi-hazardous' },
];

export const getAqiLevel = (value) => {
  if (!Number.isFinite(value)) return AQI_LEVELS[0];
  return AQI_LEVELS.find((level) => value <= level.threshold) ?? AQI_LEVELS[AQI_LEVELS.length - 1];
};
