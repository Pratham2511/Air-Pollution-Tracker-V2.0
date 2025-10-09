import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getAqiLevel } from '../../utils/aqi';

const pollutantLabels = [
  { key: 'PM2.5', label: 'PM2.5' },
  { key: 'PM10', label: 'PM10' },
  { key: 'CO', label: 'CO' },
  { key: 'NO2', label: 'NO₂' },
  { key: 'SO2', label: 'SO₂' },
  { key: 'O3', label: 'O₃' },
];

const badgeClassByLevel = {
  'aqi-good': 'bg-aqi-good text-white',
  'aqi-moderate': 'bg-aqi-moderate text-slate-900',
  'aqi-unhealthy': 'bg-aqi-unhealthy text-white',
  'aqi-very-unhealthy': 'bg-aqi-very-unhealthy text-white',
  'aqi-hazardous': 'bg-aqi-hazardous text-white',
};

export const TrackingPanel = ({ trackedCities, availableCities, onAdd, onRemove, onReorder, onSelect, isLoading }) => {
  const [selectedCityId, setSelectedCityId] = useState(availableCities[0]?.id ?? '');

  useEffect(() => {
    if (isLoading) {
      setSelectedCityId('');
      return;
    }

    if (!availableCities.some((city) => city.id === selectedCityId)) {
      setSelectedCityId(availableCities[0]?.id ?? '');
    }
  }, [availableCities, isLoading, selectedCityId]);

  const addDisabled = useMemo(() => !selectedCityId || isLoading, [isLoading, selectedCityId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Tracked Cities</h2>
          <p className="text-sm text-slate-500">
            Manage your personalized watchlist. Data persists locally so your context is waiting next time.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="tracked-city-select" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Add city
          </label>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <select
              id="tracked-city-select"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-user-primary focus:outline-none focus:ring-2 focus:ring-user-primary/30"
              value={selectedCityId}
              onChange={(event) => setSelectedCityId(event.target.value)}
              disabled={isLoading}
            >
              {availableCities.length === 0 && <option value="">All catalogued cities tracked</option>}
              {availableCities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name} · {city.country}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onAdd(selectedCityId)}
              disabled={addDisabled}
              className="rounded-lg bg-user-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-user-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-panel p-6 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <span className="h-3 w-20 rounded-full bg-slate-200" />
                <span className="h-6 w-16 rounded-full bg-slate-200" />
              </div>
              <div className="space-y-2">
                <span className="block h-4 w-32 rounded-full bg-slate-200" />
                <span className="block h-4 w-24 rounded-full bg-slate-200" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {Array.from({ length: 3 }).map((__, subIndex) => (
                  <span key={subIndex} className="block h-10 rounded-2xl bg-slate-200" />
                ))}
              </div>
              <div className="flex justify-between gap-2 text-xs">
                {Array.from({ length: 4 }).map((__, buttonIndex) => (
                  <span key={buttonIndex} className="h-3 w-16 rounded-full bg-slate-200" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {trackedCities.map((city, index) => {
          const level = getAqiLevel(city.aqi);
          return (
            <motion.div key={city.id} layout className="glass-panel p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">{city.country}</p>
                  <h3 className="text-2xl font-semibold text-slate-900">{city.name}</h3>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${badgeClassByLevel[level.color] ?? 'bg-slate-900 text-white'}`}
                >
                  AQI {city.aqi}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm text-slate-600">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Dominant</p>
                  <p className="font-semibold">{city.dominantPollutant}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Last Updated</p>
                  <p>{city.updated}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Trend</p>
                  <p>{city.trend}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {pollutantLabels.map((pollutant) => (
                  <span
                    key={pollutant.key}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-600"
                  >
                    {pollutant.label}:{' '}
                    <span className="text-slate-900">{city.pollutants[pollutant.key] ?? '—'}</span>
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-800 transition"
                  onClick={() => onReorder(city.id, index - 1)}
                  disabled={index === 0}
                >
                  ↑ Move up
                </button>
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-800 transition"
                  onClick={() => onReorder(city.id, index + 1)}
                  disabled={index === trackedCities.length - 1}
                >
                  ↓ Move down
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1 font-semibold transition ${
                    isLoading || !onSelect
                      ? 'border-slate-200 text-slate-300'
                      : 'border-slate-200 text-slate-600 hover:border-user-primary/60 hover:text-user-primary'
                  }`}
                  onClick={() => onSelect?.(city.id)}
                  disabled={isLoading || !onSelect}
                >
                  View details
                </button>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 transition"
                  onClick={() => onRemove(city.id)}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
      )}
    </div>
  );
};

TrackingPanel.propTypes = {
  trackedCities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      country: PropTypes.string.isRequired,
      aqi: PropTypes.number.isRequired,
      dominantPollutant: PropTypes.string.isRequired,
      updated: PropTypes.string.isRequired,
      trend: PropTypes.string.isRequired,
      pollutants: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
    }),
  ).isRequired,
  availableCities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      country: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onReorder: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  isLoading: PropTypes.bool,
};

TrackingPanel.defaultProps = {
  onSelect: undefined,
  isLoading: false,
};
