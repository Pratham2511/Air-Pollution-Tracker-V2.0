import { useEffect, useMemo } from 'react';
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
import { usePersistentState } from '../../hooks/usePersistentState';
import { getInitialTrackedCities } from '../../services/dashboardService';

const SelectedCityChip = ({ cityId, cityName, onRemove }) => (
  <button
    type="button"
    onClick={() => onRemove(cityId)}
    className="inline-flex items-center gap-2 rounded-full border border-user-primary/20 bg-user-primary/10 px-3 py-1 text-xs font-semibold text-user-primary transition hover:bg-user-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-user-primary/30"
    aria-label={`Remove ${cityName} from comparison`}
  >
    {cityName}
    <span className="text-user-primary">✕</span>
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
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-700 shadow-xl backdrop-blur">
      <p className="font-semibold text-user-primary">{label}</p>
      <p className="mt-1">AQI: <span className="font-semibold text-slate-900">{point.averageAqi}</span></p>
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
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-700 shadow-xl backdrop-blur">
      <p className="font-semibold text-user-primary">{entry.cityName}</p>
      <p className="mt-1">AQI {entry.aqi}</p>
      <p className="mt-1 text-slate-500">Dominant: {entry.dominantPollutant}</p>
    </div>
  );
};

MatrixTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

const LeaderboardCard = ({ title, entries }) => (
  <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-md backdrop-blur">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
      {entries.length ? (
        entries.map((entry) => (
          <div key={entry.cityId} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <div>
              <p className="font-semibold text-slate-900">{entry.cityName}</p>
              <p className="text-xs text-slate-500">Δ AQI {entry.delta}</p>
            </div>
            <span className={`text-base font-semibold ${entry.delta >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {entry.currentAqi}
            </span>
          </div>
        ))
      ) : (
        <p className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-xs text-slate-500 shadow-sm">
          No leaderboard data available for the selected window.
        </p>
      )}
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
  ),
};

LeaderboardCard.defaultProps = {
  entries: [],
};

const PollutantMatrixTable = ({ matrix }) => (
  <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-md backdrop-blur">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Pollutant Distribution</h3>
        <p className="text-sm text-slate-600">Pollutant load across selected cities</p>
      </div>
    </div>
    {matrix.length ? (
      <div className="mt-5 overflow-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm text-slate-700">
          <thead className="bg-white/70 text-xs uppercase tracking-[0.3em] text-slate-500">
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
              <tr key={row.cityId} className="border-t border-slate-200">
                <td className="px-4 py-3 font-semibold text-slate-900">{row.cityName}</td>
                {row.pollutants.map((pollutant) => (
                  <td key={pollutant.pollutant} className="px-4 py-3 text-slate-600">
                    {pollutant.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white/90 px-4 py-6 text-xs text-slate-500 shadow-sm">
        Add more tracked cities or refresh your selection to compare pollutant loads.
      </div>
    )}
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
  ),
};

PollutantMatrixTable.defaultProps = {
  matrix: [],
};

const DominantPollutantList = ({ dominantPollutants }) => (
  <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-md backdrop-blur">
    <SectionHeading
      eyebrow="dominance"
      title="Dominant pollutant by city"
      description="Identify pollutant leaders for targeted mitigation"
      alignment="left"
      size="compact"
    />
    <div className="mt-5 grid gap-3">
      {dominantPollutants.length ? (
        dominantPollutants.map((entry) => (
          <div key={entry.cityId} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900">{entry.cityName}</p>
              <p className="text-xs text-slate-500">{entry.level.label}</p>
            </div>
            <span className="rounded-full border border-user-primary/20 bg-user-primary/10 px-3 py-1 text-xs font-semibold text-user-primary">
              {entry.pollutant}
            </span>
          </div>
        ))
      ) : (
        <p className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-xs text-slate-500 shadow-sm">
          Dominant pollutant insights will appear once data is available for your selection.
        </p>
      )}
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
  ),
};

DominantPollutantList.defaultProps = {
  dominantPollutants: [],
};

const TemporalPatternChart = ({ title, data, dataKey }) => (
  <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-md backdrop-blur">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <div className="mt-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
  <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <h4 className="text-base font-semibold text-slate-900">{insight.cityName}</h4>
      <span className="text-xs text-slate-500">Correlation snapshot</span>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
      {Object.entries(insight.correlations).map(([metric, value]) => (
        <div key={metric} className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm">
          <p className="uppercase tracking-[0.3em] text-slate-500">{metric}</p>
          <p className="mt-1 font-semibold text-slate-900">{value}</p>
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
  <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-md backdrop-blur">
    <SectionHeading
      eyebrow="cumulative"
      title="Population impact overview"
      description="Aggregate exposure metrics across the selected cohort"
      alignment="left"
      size="compact"
    />
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Average AQI</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{impact.averageAqi}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Hazardous Hours</p>
        <p className="mt-2 text-3xl font-semibold text-rose-600">{impact.hazardousHours}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Alerts Issued</p>
        <p className="mt-2 text-3xl font-semibold text-amber-600">{impact.alertsIssued}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Population Exposed</p>
        <p className="mt-2 text-3xl font-semibold text-user-primary">{impact.populationExposed.toLocaleString()}</p>
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
  const [trackedIdsState] = usePersistentState('aq-tracked-city-ids', getInitialTrackedCities());
  const trackedIds = useMemo(
    () => (Array.isArray(trackedIdsState) ? trackedIdsState : []),
    [trackedIdsState],
  );
  const trackedSet = useMemo(() => new Set(trackedIds), [trackedIds]);
  const trackedCatalogEntries = useMemo(
    () => CITY_CATALOG.filter((city) => trackedSet.has(city.id)),
    [trackedSet],
  );
  const trackedIdsForAnalysis = useMemo(
    () => trackedCatalogEntries.map((city) => city.id),
    [trackedCatalogEntries],
  );
  const trackedCatalogMap = useMemo(
    () => new Map(trackedCatalogEntries.map((city) => [city.id, city])),
    [trackedCatalogEntries],
  );
  const hasEnoughTracked = trackedIdsForAnalysis.length >= 2;

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
    actions,
    source,
    lastFetched,
  } = useMultiCityAnalysisData(trackedIdsForAnalysis, { allowDefault: false });

  useEffect(() => {
    if (!trackedIdsForAnalysis.length) {
      if (selectedCityIds.length) {
        actions.setSelectedCityIds([]);
      }
      return;
    }

    const filtered = selectedCityIds.filter((cityId) => trackedSet.has(cityId));
    const fallback = filtered.length
      ? filtered
      : trackedIdsForAnalysis.slice(0, Math.min(trackedIdsForAnalysis.length, 6));

    const isSameSelection = fallback.length === selectedCityIds.length
      && fallback.every((cityId, index) => cityId === selectedCityIds[index]);

    if (!isSameSelection) {
      actions.setSelectedCityIds(fallback);
    }
  }, [actions, selectedCityIds, trackedIdsForAnalysis, trackedSet]);

  const matrixChartData = useMemo(() => overview?.matrix ?? [], [overview?.matrix]);
  const trackedAvailableCities = useMemo(
    () => trackedCatalogEntries.filter((city) => !selectedCityIds.includes(city.id)),
    [selectedCityIds, trackedCatalogEntries],
  );
  const disableAddCity = trackedAvailableCities.length === 0;

  const addCity = (event) => {
    const cityId = event.target.value;
    if (cityId && trackedSet.has(cityId)) {
      actions.toggleCity(cityId);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex="-1"
      className="min-h-screen bg-gradient-to-br from-user-muted via-white to-gov-muted text-slate-900"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-[16rem]">
            <p className="text-sm uppercase tracking-[0.3em] text-user-primary/80">Multi-city intelligence</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Regional overview
              <span className="ml-3 text-base font-normal text-slate-500">({selectedCityIds.length} cities)</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-600">
              Compare AQI profiles, pollution loads, and weather correlations across jurisdictions to spot emerging
              hotspots and track intervention performance.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 shadow-sm">
                Source: {source === 'supabase' ? 'Supabase live data' : 'Generated fallback'}
              </span>
              {lastFetched && (
                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 shadow-sm">
                  Updated {new Date(lastFetched).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="w-full max-w-sm">
            <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-md backdrop-blur">
              <div className="space-y-4">
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Add city</span>
                  <select
                    value=""
                    onChange={addCity}
                    disabled={disableAddCity}
                    className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-user-primary focus:outline-none focus:ring-2 focus:ring-user-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Select city
                    </option>
                    {trackedAvailableCities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}, {city.state}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Window</span>
                  <select
                    value={windowKey}
                    onChange={(event) => actions.setWindow(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-user-primary focus:outline-none focus:ring-2 focus:ring-user-primary/20"
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
                  disabled={isLoading}
                  className="rounded-xl border border-user-primary/20 bg-user-primary/10 px-4 py-2 text-sm font-semibold text-user-primary transition hover:bg-user-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? 'Refreshing…' : 'Refresh Overview'}
                </button>
                <Link
                  to="/dashboard"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-user-primary transition hover:border-user-primary/60 hover:text-user-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-user-primary/20"
                >
                  Back to Dashboard
                </Link>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs text-slate-500">
                {isLoading
                  ? 'Refreshing overview…'
                  : lastFetched
                    ? `Synced ${new Date(lastFetched).toLocaleTimeString()}`
                    : 'Using cached overview snapshot.'}
              </div>
            </div>
          </div>
        </header>

        {!hasEnoughTracked && (
          <div className="rounded-3xl border border-amber-300/40 bg-amber-50/80 p-4 text-sm text-amber-800">
            Track at least two cities from the dashboard to unlock comparative insights here. Add more cities to your watchlist and try again.
          </div>
        )}

        <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Selected cities</span>
            <span className="text-xs text-slate-500">
              {selectedCityIds.length ? `${selectedCityIds.length} active` : 'None selected'}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCityIds.length ? (
              selectedCityIds.map((cityId) => {
                const city = trackedCatalogMap.get(cityId) ?? CITY_CATALOG.find((c) => c.id === cityId);
                return city ? (
                  <SelectedCityChip
                    key={city.id}
                    cityId={city.id}
                    cityName={`${city.name}, ${city.state}`}
                    onRemove={actions.toggleCity}
                  />
                ) : null;
              })
            ) : (
              <span className="text-xs text-slate-500">
                Add cities from your dashboard watchlist to populate this view.
              </span>
            )}
          </div>
        </div>

        {status === 'error' && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error?.message ?? 'Unable to load multi-city overview.'}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-md backdrop-blur">
              <SectionHeading
                eyebrow="aqi matrix"
                title="Quick AQI comparison"
                description="Visualize comparative AQI loads with delta context"
                alignment="left"
                size="compact"
              />
              <div className="mt-6 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={matrixChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="cityName" stroke="#94a3b8" interval={0} angle={-20} dy={10} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip content={<MatrixTooltip />} />
                    <Bar dataKey="aqi" fill="#22d3ee" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <PollutantMatrixTable matrix={overview?.pollutantMatrix ?? []} />
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-md backdrop-blur">
                <SectionHeading
                  eyebrow="correlation"
                  title="Weather interaction insights"
                  description="Leading correlations to monitor by city"
                  alignment="left"
                  size="compact"
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
          </div>

          <aside className="space-y-6">
            <div className="grid gap-6">
              <LeaderboardCard title="Top hotspots" entries={hotspots} />
              <LeaderboardCard title="Best performers" entries={healthiest} />
              <DominantPollutantList dominantPollutants={dominantPollutants} />
            </div>
            {overview?.cumulativeImpact && <CumulativeImpactPanel impact={overview.cumulativeImpact} />}
          </aside>
        </div>

        {isLoading && (
          <div className="text-center text-sm text-slate-500">Loading multi-city overview…</div>
        )}
      </div>
    </main>
  );
};

export default MultiCityAnalysisPage;
