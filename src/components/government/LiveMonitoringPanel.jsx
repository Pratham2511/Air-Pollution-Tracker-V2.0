import PropTypes from 'prop-types';
import { forwardRef, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

const statusStyles = {
  Hazard: 'bg-rose-100 text-rose-700 border-rose-200',
  Alert: 'bg-amber-100 text-amber-700 border-amber-200',
  Watch: 'bg-sky-100 text-sky-700 border-sky-200',
  Stable: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'Hazard', label: 'Hazard' },
  { value: 'Alert', label: 'Alert' },
  { value: 'Watch', label: 'Watch' },
  { value: 'Stable', label: 'Stable' },
];

const ROW_HEIGHT = 88;
const MAX_VISIBLE_ROWS = 10;

const VirtualizedRowGroup = forwardRef((props, ref) => (
  <div ref={ref} role="rowgroup" {...props} />
));

export const LiveMonitoringPanel = ({
  rows,
  filters,
  onFilterChange,
  onRefresh,
  lastUpdated,
  isLoading,
  onExport,
}) => {
  const pollutantOptions = useMemo(() => {
    const set = new Set(rows.map((row) => row.dominantPollutant).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [rows]);

  const itemKey = useCallback((index) => rows[index]?.id ?? rows[index]?.cityId ?? index, [rows]);

  const listHeight = useMemo(() => {
    const visibleRows = Math.min(Math.max(rows.length, 1), MAX_VISIBLE_ROWS);
    return visibleRows * ROW_HEIGHT;
  }, [rows.length]);

  const renderRow = useCallback(
    ({ index, style }) => {
      const row = rows[index];
      if (!row) {
        return null;
      }

      const deltaDisplay = row.delta > 0 ? `+${row.delta}` : row.delta;
      const deltaClass = row.delta < 0 ? 'text-emerald-600' : 'text-rose-600';

      return (
        <div
          style={style}
          className={`grid min-w-[720px] grid-cols-[2.4fr,1fr,1.6fr,1fr,1.2fr] items-center border-b border-slate-100 px-6 text-slate-700 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
          role="row"
        >
          <div className="py-4 pr-6" role="cell">
            <div className="font-semibold text-slate-800">{row.city}</div>
            <div className="text-xs text-slate-500">{row.state ?? 'National network'}</div>
          </div>
          <div className="py-4 pr-6 text-lg font-semibold text-slate-800" role="cell">{row.aqi}</div>
          <div className="py-4 pr-6" role="cell">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {row.dominantPollutant}
            </span>
          </div>
          <div className="py-4 pr-6" role="cell">
            <span className={`font-semibold ${deltaClass}`}>{deltaDisplay}</span>
          </div>
          <div className="py-4" role="cell">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                statusStyles[row.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {row.status ?? 'Review'}
            </span>
          </div>
        </div>
      );
    },
    [rows],
  );

  const handleFilterChange = (key) => (event) => {
    onFilterChange({ [key]: event.target.value });
  };

  return (
    <section id="live-monitoring" className="glass-panel p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gov-primary">Live AQI Situation Room</h2>
          <p className="mt-1 text-sm text-slate-500">
            Real-time feed refreshed every few minutes. Hazard levels are escalated to the central command bus.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Network Healthy
          </span>
          {lastUpdated && <span>Last sync · {new Date(lastUpdated).toLocaleTimeString()}</span>}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <input
          value={filters.search}
          onChange={handleFilterChange('search')}
          placeholder="Search city or region"
          className="h-10 w-full max-w-xs rounded-full border border-slate-200 bg-white px-4 text-sm shadow-sm focus:border-gov-primary focus:outline-none"
        />
        <select
          value={filters.pollutant}
          onChange={handleFilterChange('pollutant')}
          className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm shadow-sm focus:border-gov-primary focus:outline-none"
        >
          {pollutantOptions.map((value) => (
            <option key={value} value={value}>
              {value === 'all' ? 'All pollutants' : value}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={handleFilterChange('status')}
          className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm shadow-sm focus:border-gov-primary focus:outline-none"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRefresh?.()}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm transition hover:text-gov-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={() => onExport?.({ format: 'csv', rows })}
            className="inline-flex items-center gap-2 rounded-full bg-gov-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gov-accent"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => onExport?.({ format: 'json', rows })}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gov-primary shadow-sm"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200" role="table" aria-rowcount={rows.length}>
        <div className="grid min-w-[720px] grid-cols-[2.4fr,1fr,1.6fr,1fr,1.2fr] border-b border-slate-200 bg-slate-50 px-6 py-3 text-left text-sm font-semibold uppercase tracking-[0.2em] text-slate-500" role="row">
          <span role="columnheader" className="pr-6">City</span>
          <span role="columnheader" className="pr-6">AQI</span>
          <span role="columnheader" className="pr-6">Dominant Pollutant</span>
          <span role="columnheader" className="pr-6">Δ last hour</span>
          <span role="columnheader">Status</span>
        </div>
        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500" role="row">
            {isLoading ? 'Loading live feed…' : 'No cities match the selected filters yet.'}
          </div>
        ) : (
          <List
            height={listHeight}
            itemCount={rows.length}
            itemKey={itemKey}
            itemSize={ROW_HEIGHT}
            width="100%"
            outerElementType={VirtualizedRowGroup}
          >
            {renderRow}
          </List>
        )}
      </div>
    </section>
  );
};

LiveMonitoringPanel.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      city: PropTypes.string,
      cityId: PropTypes.string,
      state: PropTypes.string,
      aqi: PropTypes.number,
      dominantPollutant: PropTypes.string,
      delta: PropTypes.number,
      status: PropTypes.string,
    }),
  ).isRequired,
  filters: PropTypes.shape({
    search: PropTypes.string,
    pollutant: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
  lastUpdated: PropTypes.string,
  isLoading: PropTypes.bool,
  onExport: PropTypes.func,
};

LiveMonitoringPanel.defaultProps = {
  onRefresh: undefined,
  lastUpdated: null,
  isLoading: false,
  onExport: undefined,
};
