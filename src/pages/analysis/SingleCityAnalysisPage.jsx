import { useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import PropTypes from 'prop-types';
import { SectionHeading } from '../../components/common/SectionHeading';
import { useCityAnalysisData } from '../../hooks/useCityAnalysisData';
import { CITY_CATALOG } from '../../data/cityCatalog';

const StatBadge = ({ label, value, variant = 'neutral' }) => {
  const variantClass = {
    success: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/40',
    warning: 'text-amber-200 bg-amber-500/10 border-amber-500/40',
    danger: 'text-rose-200 bg-rose-500/10 border-rose-500/40',
    neutral: 'text-slate-200 bg-slate-700/30 border-slate-600/60',
  }[variant];

  return (
    <div className={`flex flex-col gap-1 rounded-xl border px-4 py-3 ${variantClass}`}>
      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
};

StatBadge.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  variant: PropTypes.oneOf(['success', 'warning', 'danger', 'neutral']),
};

const ForecastTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-200 shadow-xl backdrop-blur">
      <p className="font-semibold text-cyan-300">Projection • {new Date(label).toLocaleString()}</p>
      <p className="mt-1">
        AQI Projection: <span className="font-semibold text-white">{point?.projectedAqi}</span>
      </p>
    </div>
  );
};

ForecastTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const trendPoint = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-200 shadow-xl backdrop-blur">
      <p className="font-semibold text-sky-300">{new Date(label).toLocaleString()}</p>
      <p className="mt-1">AQI: <span className="font-semibold text-white">{trendPoint?.aqi}</span></p>
      <p className="mt-1 text-slate-400">Rolling Avg: {trendPoint?.rollingAvg}</p>
    </div>
  );
};

TrendTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const AdvisoryCard = ({ advisory }) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
    <div className="flex items-center justify-between">
      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-400">
        {advisory.severity}
      </span>
      <span className="text-xs text-slate-500">Health Advisory</span>
    </div>
    <div>
      <h3 className="text-lg font-semibold text-slate-100">{advisory.headline}</h3>
      <p className="mt-2 text-sm text-slate-300">{advisory.description}</p>
    </div>
    <ul className="mt-2 flex flex-col gap-2 text-sm text-slate-200">
      {advisory.actions.map((action) => (
        <li key={action} className="flex items-center gap-2 text-slate-300">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 text-xs text-slate-400">
            •
          </span>
          {action}
        </li>
      ))}
    </ul>
  </div>
);

AdvisoryCard.propTypes = {
  advisory: PropTypes.shape({
    severity: PropTypes.string.isRequired,
    headline: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    actions: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};

const SourceInsight = ({ insight }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
    <div className="flex items-center justify-between">
      <h4 className="text-base font-semibold text-slate-100">{insight.source}</h4>
      <span className="text-xs text-slate-400">
        Confidence {(insight.confidence * 100).toFixed(0)}%
      </span>
    </div>
    <p className="mt-2 text-sm text-slate-300">High impact on {insight.impact}</p>
  </div>
);

SourceInsight.propTypes = {
  insight: PropTypes.shape({
    source: PropTypes.string.isRequired,
    impact: PropTypes.string.isRequired,
    confidence: PropTypes.number.isRequired,
  }).isRequired,
};

const CorrelationRow = ({ entry }) => (
  <tr className="border-t border-slate-800/80">
    <td className="px-4 py-3 text-sm capitalize text-slate-200">{entry.metric}</td>
    <td className="px-4 py-3 text-right text-sm text-slate-300">{entry.correlation}</td>
    <td className="px-4 py-3">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
        <div
          className={`absolute h-full ${entry.correlation >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
          style={{
            width: `${Math.min(Math.abs(entry.correlation) * 100, 100)}%`,
            left:
              entry.correlation >= 0
                ? '50%'
                : `${50 - Math.min(Math.abs(entry.correlation) * 100, 100)}%`,
          }}
        />
        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-slate-700/80" />
      </div>
    </td>
  </tr>
);

CorrelationRow.propTypes = {
  entry: PropTypes.shape({
    metric: PropTypes.string.isRequired,
    correlation: PropTypes.number.isRequired,
  }).isRequired,
};

const ForecastSection = ({ trendSeries, forecast }) => {
  const combined = useMemo(() => {
    if (!trendSeries?.length) return [];
    const latestTimestamp = trendSeries[trendSeries.length - 1]?.timestamp;
    return [
      ...trendSeries.map((point) => ({ ...point, type: 'historical' })),
      ...(forecast?.shortTerm ?? []).map((point) => ({
        ...point,
        timestamp: point.timestamp,
        aqi: point.projectedAqi,
        type: 'forecast-short',
      })),
      ...(forecast?.longTerm ?? []).map((point) => ({
        ...point,
        aqi: point.projectedAqi,
        type: 'forecast-long',
      })),
    ].map((point) => ({
      ...point,
      displayTimestamp: new Date(point.timestamp ?? latestTimestamp).toISOString(),
    }));
  }, [trendSeries, forecast]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">AQI Trend & Forecast</h3>
          <p className="text-sm text-slate-400">
            Historical AQI blended with exponential smoothing projections for the next cycle.
          </p>
        </div>
      </div>

      <div className="mt-6 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combined} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="displayTimestamp"
              stroke="#94a3b8"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
              minTickGap={32}
            />
            <YAxis stroke="#94a3b8" width={60} domain={[0, 500]} />
            <Tooltip content={<TrendTooltip />} />
            <Line
              type="monotone"
              dataKey="aqi"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rollingAvg"
              stroke="#a855f7"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
          <h4 className="text-sm font-semibold text-slate-200">Short-term Outlook</h4>
          <div className="mt-3 flex flex-col gap-2 text-xs text-slate-300">
            {(forecast?.shortTerm ?? []).map((point) => (
              <div
                key={point.timestamp}
                className="flex items-center justify-between rounded-lg bg-slate-900/70 px-3 py-2"
              >
                <span>{new Date(point.timestamp).toLocaleString()}</span>
                <span className="font-semibold text-cyan-300">AQI {point.projectedAqi}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
          <h4 className="text-sm font-semibold text-slate-200">Extended Forecast</h4>
          <div className="mt-3 flex flex-col gap-2 text-xs text-slate-300">
            {(forecast?.longTerm ?? []).map((point) => (
              <div
                key={point.timestamp}
                className="flex items-center justify-between rounded-lg bg-slate-900/70 px-3 py-2"
              >
                <span>{new Date(point.timestamp).toLocaleDateString()}</span>
                <span className="font-semibold text-emerald-300">AQI {point.projectedAqi}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

ForecastSection.propTypes = {
  trendSeries: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.string,
      aqi: PropTypes.number,
      rollingAvg: PropTypes.number,
    }),
  ),
  forecast: PropTypes.shape({
    shortTerm: PropTypes.arrayOf(
      PropTypes.shape({
        timestamp: PropTypes.string.isRequired,
        projectedAqi: PropTypes.number.isRequired,
      }),
    ),
    longTerm: PropTypes.arrayOf(
      PropTypes.shape({
        timestamp: PropTypes.string.isRequired,
        projectedAqi: PropTypes.number.isRequired,
      }),
    ),
  }),
};

ForecastSection.defaultProps = {
  trendSeries: [],
  forecast: { shortTerm: [], longTerm: [] },
};

const PollutantBreakdownChart = ({ breakdown }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Pollutant Concentrations</h3>
        <p className="text-sm text-slate-400">Relative pollutant load over the selected window.</p>
      </div>
    </div>
    <div className="mt-6 h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={breakdown} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pollutantGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="pollutant" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => `${value}`} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload;
              return (
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-200 shadow-xl backdrop-blur">
                  <p className="font-semibold text-sky-300">{point.pollutant}</p>
                  <p className="mt-1">
                    Concentration: <span className="font-semibold text-white">{point.value} {point.unit}</span>
                  </p>
                  <p className="mt-1 text-slate-400 capitalize">Role: {point.dominance}</p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#38bdf8"
            strokeWidth={2}
            fill="url(#pollutantGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

PollutantBreakdownChart.propTypes = {
  breakdown: PropTypes.arrayOf(
    PropTypes.shape({
      pollutant: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      unit: PropTypes.string,
      dominance: PropTypes.string,
    }),
  ),
};

PollutantBreakdownChart.defaultProps = {
  breakdown: [],
};

const WeatherCorrelationTable = ({ correlations }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Weather Correlation</h3>
        <p className="text-sm text-slate-400">How meteorological metrics relate to AQI movement.</p>
      </div>
    </div>
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800/70">
      <table className="w-full border-collapse text-left text-sm text-slate-200">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.3em] text-slate-400">
          <tr>
            <th className="px-4 py-3">Metric</th>
            <th className="px-4 py-3 text-right">Correlation</th>
            <th className="px-4 py-3">Trend Strength</th>
          </tr>
        </thead>
        <tbody>
          {correlations?.map((entry) => (
            <CorrelationRow key={entry.metric} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

WeatherCorrelationTable.propTypes = {
  correlations: PropTypes.arrayOf(
    PropTypes.shape({
      metric: PropTypes.string.isRequired,
      correlation: PropTypes.number.isRequired,
    }),
  ),
};

WeatherCorrelationTable.defaultProps = {
  correlations: [],
};

const ExposureMetrics = ({ exposure }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
    <h3 className="text-lg font-semibold text-slate-100">Exposure Snapshot</h3>
    <p className="mt-1 text-sm text-slate-400">Estimated population impact over the selected window.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Population Impacted</p>
        <p className="mt-2 text-2xl font-semibold text-slate-100">
          {exposure?.estimatedPopulation ? exposure.estimatedPopulation.toLocaleString() : '—'}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">AQI Load Index</p>
        <p className="mt-2 text-2xl font-semibold text-amber-200">{exposure?.aqiLoadIndex ?? '—'}</p>
      </div>
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Critical Exposure Hours</p>
        <p className="mt-2 text-2xl font-semibold text-rose-200">{exposure?.exposureHours ?? '—'}</p>
      </div>
    </div>
  </div>
);

ExposureMetrics.propTypes = {
  exposure: PropTypes.shape({
    estimatedPopulation: PropTypes.number,
    aqiLoadIndex: PropTypes.number,
    exposureHours: PropTypes.number,
  }),
};

ExposureMetrics.defaultProps = {
  exposure: null,
};

const DominantPollutantCallout = ({ pollutant }) => {
  if (!pollutant) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
        Dominant pollutant details will appear once data is available.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-cyan-900/30 via-slate-900/70 to-slate-950 p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Dominant Pollutant</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xl font-semibold text-cyan-100">
          {pollutant.pollutant}
        </div>
        <div className="text-sm text-slate-300">
          <p>
            Concentration: <span className="font-semibold text-white">{pollutant.value} {pollutant.unit}</span>
          </p>
          <p className="mt-1 capitalize text-slate-400">Role: {pollutant.dominance}</p>
        </div>
      </div>
    </div>
  );
};

DominantPollutantCallout.propTypes = {
  pollutant: PropTypes.shape({
    pollutant: PropTypes.string,
    value: PropTypes.number,
    unit: PropTypes.string,
    dominance: PropTypes.string,
  }),
};

DominantPollutantCallout.defaultProps = {
  pollutant: null,
};

export const SingleCityAnalysisPage = () => {
  const navigate = useNavigate();
  const { cityId } = useParams();
  const {
    analysis,
    city,
    status,
    error,
    window: windowKey,
    availableWindows,
    dominantPollutant,
    riskLevel,
    highlightMetrics,
    actions,
    source,
    lastFetched,
  } = useCityAnalysisData(cityId);

  const titleCityName = city?.name ?? cityId;

  const aqiBadgeVariant = useMemo(() => {
    switch (riskLevel.color) {
      case 'aqi-good':
        return 'success';
      case 'aqi-moderate':
        return 'neutral';
      case 'aqi-unhealthy':
        return 'warning';
      case 'aqi-very-unhealthy':
      case 'aqi-hazardous':
        return 'danger';
      default:
        return 'neutral';
    }
  }, [riskLevel.color]);

  const handleCityChange = (event) => {
    const nextCityId = event.target.value;
    if (nextCityId) {
      navigate(`/analysis/${nextCityId}`);
    }
  };

  const resolvedCityId = cityId ?? CITY_CATALOG[0]?.id ?? '';

  return (
    <main id="main-content" tabIndex="-1" className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-[16rem]">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">City Intelligence</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              {titleCityName}
              <span className="ml-3 text-base font-normal text-slate-400">
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                ({riskLevel.label} • AQI {highlightMetrics.currentAqi ?? '—'})
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-300">
              Track AQI trajectories, pollutant loads, health advisories, and weather correlations for any jurisdiction.
              This workspace blends real-time intelligence with forecast projections to guide rapid response.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="rounded-full border border-slate-800/70 bg-slate-900/60 px-3 py-1">
                Source: {source === 'supabase' ? 'Supabase live data' : 'Generated fallback'}
              </span>
              {lastFetched && (
                <span className="rounded-full border border-slate-800/70 bg-slate-900/60 px-3 py-1">
                  Updated {new Date(lastFetched).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex min-w-[14rem] flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">City</span>
              <select
                value={resolvedCityId}
                onChange={handleCityChange}
                className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {CITY_CATALOG.map((catalogCity) => (
                  <option key={catalogCity.id} value={catalogCity.id}>
                    {catalogCity.name}, {catalogCity.state}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Window</span>
              <select
                value={windowKey}
                onChange={(event) => actions.setWindow(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {availableWindows.map((windowOption) => (
                  <option key={windowOption} value={windowOption}>
                    {windowOption}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={actions.refresh}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
            >
              Refresh Data
            </button>
            <Link
              to="/analysis/overview"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              View Multi-City Overview
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error.message ?? 'Unable to load analysis data.'}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBadge label="Current AQI" value={highlightMetrics.currentAqi ?? '—'} variant={aqiBadgeVariant} />
          <StatBadge label="Trend" value={highlightMetrics.trendDirection} variant="neutral" />
          <StatBadge label="Critical Hours" value={highlightMetrics.criticalHours} variant="warning" />
          <StatBadge label="Advisory Triggers" value={highlightMetrics.advisoryTriggers} variant="danger" />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ForecastSection trendSeries={analysis?.trendSeries} forecast={analysis?.forecast} />
          </div>
          <DominantPollutantCallout pollutant={dominantPollutant} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <PollutantBreakdownChart breakdown={analysis?.pollutantBreakdown} />
          <WeatherCorrelationTable correlations={analysis?.weatherCorrelations} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <SectionHeading
              eyebrow="health guidance"
              title="Targeted advisories"
              description="Recommended actions tailored to AQI severity and vulnerable populations."
              alignment="left"
            />
            <div className="grid gap-4">
              {(analysis?.healthAdvisories ?? []).map((advisory) => (
                <AdvisoryCard key={advisory.headline} advisory={advisory} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <SectionHeading
              eyebrow="source intelligence"
              title="Likely contributing sources"
              description="Confidence-weighted hypotheses to guide field verification and mitigation."
              alignment="left"
            />
            <div className="grid gap-3">
              {(analysis?.sourceAttribution ?? []).map((insight) => (
                <SourceInsight key={insight.source} insight={insight} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <ExposureMetrics exposure={analysis?.exposure} />
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
            <SectionHeading
              eyebrow="comparisons"
              title="Period-over-period overview"
              description="Contrast recent AQI averages versus prior windows to detect shifts early."
              alignment="left"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Current Window Avg</p>
                <p className="mt-2 text-3xl font-semibold text-slate-100">
                  {analysis?.comparisons?.currentAverage ?? '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Previous Window Avg</p>
                <p className="mt-2 text-3xl font-semibold text-slate-100">
                  {analysis?.comparisons?.previousAverage ?? '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Delta</p>
                <p
                  className={`mt-2 text-3xl font-semibold ${
                    analysis?.comparisons?.delta >= 0 ? 'text-rose-200' : 'text-emerald-200'
                  }`}
                >
                  {analysis?.comparisons?.delta ?? '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Direction</p>
                <p className="mt-2 text-3xl font-semibold text-slate-100">
                  {analysis?.comparisons?.direction ?? '—'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {status === 'loading' && (
          <div className="text-center text-sm text-slate-500">Loading analysis…</div>
        )}
      </div>
    </main>
  );
};

export default SingleCityAnalysisPage;
