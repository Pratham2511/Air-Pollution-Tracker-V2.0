import PropTypes from 'prop-types';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const windowLabels = {
  '24h': '24 Hours',
  '7d': '7 Days',
  '30d': '30 Days',
};

export const HistoricalTrendsPanel = ({
  series,
  highlights,
  selectedWindow,
  onWindowChange,
  selectedCity,
  onCityChange,
  availableCities,
  policyInsights,
}) => {
  const data = series?.[selectedWindow] ?? [];

  return (
    <section id="historical-trends" className="glass-panel p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gov-primary">Historical Trend Analysis</h2>
          <p className="mt-1 text-sm text-slate-500">
            Compare high-value windows to detect policy impacts and emerging hotspots over time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          <select
            value={selectedCity}
            onChange={(event) => onCityChange?.(event.target.value)}
            className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm shadow-sm focus:border-gov-primary focus:outline-none"
          >
            {availableCities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          <div className="inline-flex gap-2 rounded-full bg-gov-primary/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-gov-primary">
            Data Integrity · 98.7%
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        {Object.keys(windowLabels).map((window) => (
          <button
            key={window}
            onClick={() => onWindowChange?.(window)}
            type="button"
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
              selectedWindow === window
                ? 'border-gov-primary bg-gov-primary text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-gov-primary hover:text-gov-primary'
            }`}
          >
            {windowLabels[window]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {highlights.map((card) => (
          <div key={card.id} className="rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
            <p className="mt-4 text-3xl font-semibold text-gov-primary">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.meta}</p>
            {card.status && (
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <span className="h-2 w-2 rounded-full bg-gov-accent" />
                {card.status}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <h3 className="text-lg font-semibold text-slate-700">AQI Trajectory</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  cursor={{ stroke: '#0f172a', strokeWidth: 0.5, strokeDasharray: '4 4' }}
                  formatter={(value, name) => [value, name === 'aqi' ? 'AQI' : 'Forecast']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="aqi"
                  stroke="#022c22"
                  strokeWidth={2.5}
                  dot={false}
                  name="AQI"
                />
                <Line type="monotone" dataKey="forecast" stroke="#f97316" strokeWidth={2} dot={false} name="Forecast" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <h3 className="text-lg font-semibold text-slate-700">Policy Impact Watchlist</h3>
          <ul className="mt-4 space-y-4 text-sm text-slate-600">
            {(policyInsights?.length ? policyInsights : [
                {
                  id: 'baseline',
                  title: 'Monitoring in progress',
                  summary: 'Connect policy annotations to surface changes to populate this panel.',
                },
              ]).map((item) => (
                  <li key={item.id ?? item.title} className="rounded-2xl bg-slate-100/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-700">{item.title}</p>
                        {item.cityName && (
                          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{item.cityName}</p>
                        )}
                      </div>
                      {item.status && (
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-gov-primary">
                          {item.status}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{item.summary ?? item.description ?? 'Impact details pending ingestion.'}</p>
                    {(item.impactScore != null || item.confidence != null || item.effectiveFrom) && (
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {item.impactScore != null && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-600">
                            Impact {Number(item.impactScore).toFixed(1)}%
                          </span>
                        )}
                        {item.confidence != null && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-600">
                            Confidence {Math.round(Number(item.confidence) * 100)}%
                          </span>
                        )}
                        {item.effectiveFrom && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-600">
                            Since {new Date(item.effectiveFrom).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

HistoricalTrendsPanel.propTypes = {
  series: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    aqi: PropTypes.number,
    forecast: PropTypes.number,
  }))).isRequired,
  highlights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      meta: PropTypes.string,
      status: PropTypes.string,
    }),
  ).isRequired,
  selectedWindow: PropTypes.oneOf(['24h', '7d', '30d']).isRequired,
  onWindowChange: PropTypes.func,
  selectedCity: PropTypes.string,
  onCityChange: PropTypes.func,
  availableCities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    }),
  ),
  policyInsights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      summary: PropTypes.string,
      description: PropTypes.string,
      status: PropTypes.string,
      cityName: PropTypes.string,
      impactScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      confidence: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      effectiveFrom: PropTypes.string,
      effectiveTo: PropTypes.string,
      metadata: PropTypes.object,
    }),
  ),
};

HistoricalTrendsPanel.defaultProps = {
  onWindowChange: undefined,
  selectedCity: null,
  onCityChange: undefined,
  availableCities: [],
  policyInsights: undefined,
};
