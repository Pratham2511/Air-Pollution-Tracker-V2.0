import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { SectionHeading } from '../../components/common/SectionHeading';
import { useMultiCityAnalysisData } from '../../hooks/useMultiCityAnalysisData';
import { CITY_CATALOG } from '../../data/cityCatalog';

const SelectedCityChip = ({ cityId, cityName, onRemove }) => (
  <button
    type="button"
    onClick={() => onRemove(cityId)}
    className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
  >
    {cityName}
    <span className="text-cyan-300">✕</span>
  </button>
);

SelectedCityChip.propTypes = {
  cityId: PropTypes.string.isRequired,
  cityName: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
};

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-200 shadow-xl backdrop-blur">
      <p className="font-semibold text-sky-300">{label}</p>
      <p className="mt-1">AQI: <span className="font-semibold text-white">{point.averageAqi}</span></p>
    </div>
  );
};

TrendTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const MatrixTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-200 shadow-xl backdrop-blur">
      <p className="font-semibold text-emerald-300">{entry.cityName}</p>
      <p className="mt-1">AQI {entry.aqi}</p>
      <p className="mt-1 text-slate-400">Dominant: {entry.dominantPollutant}</p>
    </div>
  );
};

MatrixTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

const LeaderboardCard = ({ title, entries }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
    <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
    <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
      {entries.map((entry) => (
        <div key={entry.cityId} className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3">
          <div>
            <p className="font-semibold text-slate-100">{entry.cityName}</p>
            <p className="text-xs text-slate-400">Δ AQI {entry.delta}</p>
          </div>
          <span className={`text-base font-semibold ${entry.delta >= 0 ? 'text-rose-200' : 'text-emerald-200'}`}>
            {entry.currentAqi}
          </span>
        </div>
      ))}
    </div>
  </div>
);

LeaderboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      cityId: PropTypes.string.isRequired,
      cityName: PropTypes.string.isRequired,
      delta: PropTypes.number.isRequired,
      currentAqi: PropTypes.number.isRequired,
    }),
  ).isRequired,
};

const PollutantMatrixTable = ({ matrix }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Pollutant Distribution</h3>
        <p className="text-sm text-slate-400">Pollutant load across selected cities</p>
      </div>
    </div>
    <div className="mt-5 overflow-auto">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm text-slate-200">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.3em] text-slate-400">
          <tr>
            <th className="px-4 py-3">City</th>
            <th className="px-4 py-3">PM2.5</th>
            <th className="px-4 py-3">PM10</th>
            <th className="px-4 py-3">NO₂</th>
            <th className="px-4 py-3">SO₂</th>
            <th className="px-4 py-3">CO</th>
            <th className="px-4 py-3">O₃</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={row.cityId} className="border-t border-slate-800/60">
              <td className="px-4 py-3 font-semibold text-slate-100">{row.cityName}</td>
              {row.pollutants.map((pollutant) => (
                <td key={pollutant.pollutant} className="px-4 py-3 text-slate-300">
                  {pollutant.value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

PollutantMatrixTable.propTypes = {
  matrix: PropTypes.arrayOf(
    PropTypes.shape({
      cityId: PropTypes.string.isRequired,
      cityName: PropTypes.string.isRequired,
      pollutants: PropTypes.arrayOf(
        PropTypes.shape({
          pollutant: PropTypes.string.isRequired,
          value: PropTypes.number.isRequired,
        }),
      ).isRequired,
    }),
  ).isRequired,
};

const DominantPollutantList = ({ dominantPollutants }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
    <SectionHeading
      eyebrow="dominance"
      title="Dominant pollutant by city"
      description="Identify pollutant leaders for targeted mitigation"
      alignment="left"
    />
    <div className="mt-5 grid gap-3">
      {dominantPollutants.map((entry) => (
        <div key={entry.cityId} className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">{entry.cityName}</p>
            <p className="text-xs text-slate-400">{entry.level.label}</p>
          </div>
          <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            {entry.pollutant}
          </span>
        </div>
      ))}
    </div>
  </div>
);

DominantPollutantList.propTypes = {
  dominantPollutants: PropTypes.arrayOf(
    PropTypes.shape({
      cityId: PropTypes.string.isRequired,
      cityName: PropTypes.string.isRequired,
      pollutant: PropTypes.string.isRequired,
      level: PropTypes.object.isRequired,
    }),
  ).isRequired,
};

const TemporalPatternChart = ({ title, data, dataKey }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
    <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
    <div className="mt-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey={dataKey === 'hourly' ? 'hour' : 'day'} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip content={<TrendTooltip />} />
          <Line type="monotone" dataKey="averageAqi" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

TemporalPatternChart.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      averageAqi: PropTypes.number.isRequired,
    }),
  ).isRequired,
  dataKey: PropTypes.oneOf(['hourly', 'weekly']).isRequired,
};

const CorrelationInsightCard = ({ insight }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
    <div className="flex items-center justify-between">
      <h4 className="text-base font-semibold text-slate-100">{insight.cityName}</h4>
      <span className="text-xs text-slate-400">Correlation snapshot</span>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
      {Object.entries(insight.correlations).map(([metric, value]) => (
        <div key={metric} className="rounded-xl border border-slate-800/70 bg-slate-900/60 px-3 py-2">
          <p className="uppercase tracking-[0.3em] text-slate-500">{metric}</p>
          <p className="mt-1 font-semibold text-white">{value}</p>
        </div>
      ))}
    </div>
  </div>
);

CorrelationInsightCard.propTypes = {
  insight: PropTypes.shape({
    cityName: PropTypes.string.isRequired,
    correlations: PropTypes.object.isRequired,
  }).isRequired,
};

const CumulativeImpactPanel = ({ impact }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
    <SectionHeading
      eyebrow="cumulative"
      title="Population impact overview"
      description="Aggregate exposure metrics across the selected cohort"
      alignment="left"
    />
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Average AQI</p>
        <p className="mt-2 text-3xl font-semibold text-slate-100">{impact.averageAqi}</p>
      </div>
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Hazardous Hours</p>
        <p className="mt-2 text-3xl font-semibold text-rose-200">{impact.hazardousHours}</p>
      </div>
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Alerts Issued</p>
        <p className="mt-2 text-3xl font-semibold text-amber-200">{impact.alertsIssued}</p>
      </div>
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Population Exposed</p>
        <p className="mt-2 text-3xl font-semibold text-cyan-200">{impact.populationExposed.toLocaleString()}</p>
      </div>
    </div>
  </div>
);

CumulativeImpactPanel.propTypes = {
  impact: PropTypes.shape({
    averageAqi: PropTypes.number.isRequired,
    hazardousHours: PropTypes.number.isRequired,
    alertsIssued: PropTypes.number.isRequired,
    populationExposed: PropTypes.number.isRequired,
  }).isRequired,
};

export const MultiCityAnalysisPage = () => {
  const {
    status,
    isLoading,
    overview,
    error,
    selectedCityIds,
    availableWindows,
    window: windowKey,
    hotspots,
    healthiest,
    dominantPollutants,
    availableCities,
    actions,
    source,
    lastFetched,
  } = useMultiCityAnalysisData();

  const matrixChartData = useMemo(() => overview?.matrix ?? [], [overview?.matrix]);

  const addCity = (event) => {
    const cityId = event.target.value;
    if (cityId) {
      actions.toggleCity(cityId);
    }
  };

  return (
    <main id="main-content" tabIndex="-1" className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-[16rem]">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">Multi-city intelligence</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Regional overview
              <span className="ml-3 text-base font-normal text-slate-400">({selectedCityIds.length} cities)</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-300">
              Compare AQI profiles, pollution loads, and weather correlations across jurisdictions to spot emerging
              hotspots and track intervention performance.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
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
          <div className="flex min-w-[16rem] flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Add city</span>
              <select
                value=""
                onChange={addCity}
                className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="" disabled>
                  Select city
                </option>
                {availableCities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}, {city.state}
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
              Refresh Overview
            </button>
            <Link
              to="/dashboard"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Selected cities</span>
          {selectedCityIds.map((cityId) => {
            const city = CITY_CATALOG.find((c) => c.id === cityId);
            return city ? (
              <SelectedCityChip
                key={city.id}
                cityId={city.id}
                cityName={`${city.name}, ${city.state}`}
                onRemove={actions.toggleCity}
              />
            ) : null;
          })}
        </div>

        {status === 'error' && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error?.message ?? 'Unable to load multi-city overview.'}
          </div>
        )}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <SectionHeading
            eyebrow="aqi matrix"
            title="Quick AQI comparison"
            description="Visualize comparative AQI loads with delta context"
            alignment="left"
          />
          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={matrixChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="cityName" stroke="#94a3b8" interval={0} angle={-20} dy={10} />
                <YAxis stroke="#94a3b8" />
                <Tooltip content={<MatrixTooltip />} />
                <Bar dataKey="aqi" fill="#22d3ee" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <LeaderboardCard title="Top hotspots" entries={hotspots} />
          <LeaderboardCard title="Best performers" entries={healthiest} />
          <DominantPollutantList dominantPollutants={dominantPollutants} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <PollutantMatrixTable matrix={overview?.pollutantMatrix ?? []} />
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <SectionHeading
              eyebrow="correlation"
              title="Weather interaction insights"
              description="Leading correlations to monitor by city"
              alignment="left"
            />
            <div className="mt-5 grid gap-3">
              {(overview?.correlationInsights ?? []).map((insight) => (
                <CorrelationInsightCard key={insight.cityId} insight={insight} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <TemporalPatternChart
            title="Hourly pattern"
            data={overview?.temporalPatterns?.hourly ?? []}
            dataKey="hourly"
          />
          <TemporalPatternChart
            title="Weekly pattern"
            data={overview?.temporalPatterns?.weekly ?? []}
            dataKey="weekly"
          />
        </section>

        {overview?.cumulativeImpact && <CumulativeImpactPanel impact={overview.cumulativeImpact} />}

        {isLoading && (
          <div className="text-center text-sm text-slate-500">Loading multi-city overview…</div>
        )}
      </div>
    </main>
  );
};

export default MultiCityAnalysisPage;
