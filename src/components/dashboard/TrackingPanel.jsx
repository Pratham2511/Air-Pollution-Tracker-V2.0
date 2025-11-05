import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getAqiLevel } from '../../utils/aqi';
import { Skeleton } from '../common';

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

export const TrackingPanel = ({
  trackedCities,
  availableCities,
  onAdd,
  onRemove,
  onReorder,
  onSelect,
  onOpenAnalysis,
  onOpenOverview,
  canOpenOverview,
  isLoading,
}) => {
  const [selectedCityId, setSelectedCityId] = useState(availableCities[0]?.id ?? '');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = useMemo(() => {
    if (!searchQuery) {
      return availableCities;
    }
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) {
      return availableCities;
    }
    return availableCities.filter((city) =>
      terms.every((term) =>
        city.name.toLowerCase().includes(term)
        || city.country.toLowerCase().includes(term)
        || (city.region ? city.region.toLowerCase().includes(term) : false),
      ),
    );
  }, [availableCities, searchQuery]);

  useEffect(() => {
    if (isLoading) {
      setSelectedCityId('');
      return;
    }

    if (!filteredCities.some((city) => city.id === selectedCityId)) {
      setSelectedCityId(filteredCities[0]?.id ?? '');
    }
  }, [filteredCities, isLoading, selectedCityId]);

  const addDisabled = useMemo(() => !selectedCityId || isLoading, [isLoading, selectedCityId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Tracked Cities</h2>
          <p className="text-sm text-slate-500">
            Manage your personalized watchlist. Preferences sync to your account when you&apos;re signed in and persist locally offline.
          </p>
          {onOpenOverview && (
            <button
              type="button"
              onClick={onOpenOverview}
              disabled={!canOpenOverview}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-user-primary shadow-sm transition hover:border-user-primary/60 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Tracked city analysis
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="tracked-city-select" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Add city
          </label>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Search ${availableCities.length + trackedCities.length} cities`}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-user-primary focus:outline-none focus:ring-2 focus:ring-user-primary/30"
              disabled={isLoading}
            />
            <select
              id="tracked-city-select"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-user-primary focus:outline-none focus:ring-2 focus:ring-user-primary/30"
              value={selectedCityId}
              onChange={(event) => setSelectedCityId(event.target.value)}
              disabled={isLoading}
            >
              {filteredCities.length === 0 && <option value="">No matches found</option>}
              {filteredCities.map((city) => (
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

      {!isLoading && (
        <div className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-xs font-medium text-slate-500 shadow-sm">
          Tracking {trackedCities.length} city{trackedCities.length === 1 ? '' : 'ies'} · {filteredCities.length} ready to add
          {searchQuery && filteredCities.length > 0 ? ` for “${searchQuery}”` : ''}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-panel is-static p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24 border-none shadow-none" rounded="rounded-full" />
                <Skeleton className="h-6 w-16 border-none shadow-none" rounded="rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="block h-4 w-32 border-none shadow-none" rounded="rounded-full" />
                <Skeleton className="block h-4 w-24 border-none shadow-none" rounded="rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {Array.from({ length: 3 }).map((__, subIndex) => (
                  <Skeleton key={subIndex} className="h-12 border-none shadow-none" rounded="rounded-2xl" />
                ))}
              </div>
              <div className="flex justify-between gap-2 text-xs">
                {Array.from({ length: 4 }).map((__, buttonIndex) => (
                  <Skeleton key={buttonIndex} className="h-3 w-16 border-none shadow-none" rounded="rounded-full" />
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
                  className={`rounded-full border px-3 py-1 font-semibold transition ${
                    !onOpenAnalysis
                      ? 'border-slate-200 text-slate-300'
                      : 'border-user-primary/20 text-user-primary hover:border-user-primary hover:bg-user-primary/5'
                  }`}
                  onClick={() => onOpenAnalysis?.(city.id)}
                  disabled={!onOpenAnalysis}
                >
                  Open analysis
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
      region: PropTypes.string,
    }),
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onReorder: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  onOpenAnalysis: PropTypes.func,
  onOpenOverview: PropTypes.func,
  canOpenOverview: PropTypes.bool,
  isLoading: PropTypes.bool,
};

TrackingPanel.defaultProps = {
  onSelect: undefined,
  onOpenAnalysis: undefined,
  onOpenOverview: undefined,
  canOpenOverview: false,
  isLoading: false,
};
