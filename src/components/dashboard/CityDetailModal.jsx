import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { getAqiLevel } from '../../utils/aqi';

const pollutantLabels = [
  { key: 'PM2.5', label: 'PM2.5', description: 'Fine particulate matter that penetrates deeply into lungs.' },
  { key: 'PM10', label: 'PM10', description: 'Coarse particles such as dust and mold spores.' },
  { key: 'CO', label: 'CO', description: 'Carbon monoxide; primarily from incomplete combustion.' },
  { key: 'NO2', label: 'NO₂', description: 'Nitrogen dioxide from vehicles and power plants.' },
  { key: 'SO2', label: 'SO₂', description: 'Sulfur dioxide; often linked to industrial activity.' },
  { key: 'O3', label: 'O₃', description: 'Ground-level ozone; exacerbated by sunlight and emissions.' },
];

const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalContent = {
  initial: { opacity: 0, scale: 0.96, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.96, y: 20, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const CityDetailModal = ({ city, onClose, onOpenAnalysis }) => {
  useEffect(() => {
    if (!city) {
      return undefined;
    }

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [city, onClose]);

  if (!city) {
    return null;
  }

  const aqiLevel = getAqiLevel(city.aqi);
  const populationDisplay = Number.isFinite(city.population)
    ? city.population.toLocaleString()
    : '—';
  const timezoneOffset = city.metadata?.timezoneOffset ?? null;
  const timezoneDisplay = timezoneOffset === null
    ? '—'
    : `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-10"
        {...modalBackdrop}
        aria-modal="true"
        role="dialog"
        aria-labelledby="city-modal-title"
        aria-describedby="city-modal-description"
      >
        <motion.div className="glass-panel relative max-w-3xl w-full p-8 sm:p-10 space-y-6 overflow-y-auto max-h-full" {...modalContent}>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-500 hover:bg-slate-200"
          >
            Close
          </button>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">City Snapshot</p>
            <h2 id="city-modal-title" className="mt-3 text-3xl font-semibold text-slate-900">
              {city.name}{' '}
              <span className="text-slate-400 font-medium">· {city.country}</span>
            </h2>
            <p id="city-modal-description" className="mt-2 text-sm text-slate-500">
              Detailed pollutant breakdown with latest AQI reading and health guidance for this location.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white/70 p-5 shadow-inner">
              <p className="text-xs uppercase tracking-wide text-slate-500">Current AQI</p>
              <p className="mt-2 text-4xl font-semibold text-slate-900">{city.aqi}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{aqiLevel.label}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/70 p-5 shadow-inner">
              <p className="text-xs uppercase tracking-wide text-slate-500">Dominant Pollutant</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{city.dominantPollutant}</p>
              <p className="mt-1 text-xs text-slate-500">Updated {city.updated}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/70 p-5 shadow-inner">
              <p className="text-xs uppercase tracking-wide text-slate-500">Trend</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{city.trend}</p>
              <p className="mt-1 text-xs text-slate-500">Location: {city.lat.toFixed(2)}, {city.lng.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white/70 p-5 shadow-inner">
              <p className="text-xs uppercase tracking-wide text-slate-500">Population</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{populationDisplay}</p>
              <p className="mt-1 text-xs text-slate-500">Estimated residents within metro boundary.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/70 p-5 shadow-inner">
              <p className="text-xs uppercase tracking-wide text-slate-500">Region &amp; Timezone</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{city.region ?? '—'}</p>
              <p className="mt-1 text-xs text-slate-500">Timezone: {timezoneDisplay}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Pollutant concentrations</h3>
            <div className="space-y-3">
              {pollutantLabels.map((pollutant) => {
                const value = city.pollutants[pollutant.key] ?? '—';
                return (
                  <div key={pollutant.key} className="rounded-2xl border border-slate-100 bg-white/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{pollutant.label}</p>
                        <p className="text-xs text-slate-500">{pollutant.description}</p>
                      </div>
                      <span className="text-base font-semibold text-slate-900">{value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-gradient-to-r from-user-muted/50 to-user-primary/10 p-6">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Health guidance</h4>
            <p className="mt-2 text-sm text-slate-700">
              {aqiLevel.threshold <= 100
                ? 'Air quality is acceptable. Sensitive groups should monitor for changes.'
                : 'Air quality is deteriorating. Consider limiting outdoor exertion and use air purifiers indoors.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenAnalysis?.(city.id)}
              disabled={!onOpenAnalysis}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                onOpenAnalysis
                  ? 'bg-user-primary text-white shadow-sm hover:bg-user-primary/90'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              View full analysis
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

CityDetailModal.propTypes = {
  city: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
    aqi: PropTypes.number.isRequired,
    dominantPollutant: PropTypes.string.isRequired,
    updated: PropTypes.string.isRequired,
    trend: PropTypes.string.isRequired,
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    pollutants: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
    population: PropTypes.number,
    region: PropTypes.string,
    metadata: PropTypes.shape({
      timezoneOffset: PropTypes.number,
      population: PropTypes.number,
      source: PropTypes.string,
    }),
  }),
  onClose: PropTypes.func.isRequired,
  onOpenAnalysis: PropTypes.func,
};

CityDetailModal.defaultProps = {
  city: null,
  onOpenAnalysis: undefined,
};