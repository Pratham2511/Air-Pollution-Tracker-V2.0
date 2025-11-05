import PropTypes from 'prop-types';
import { ISSUE_LABELS } from '../../utils/measurementUploads';

const STATUS_TONE_MAP = {
  active: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  queued: 'bg-amber-100 text-amber-700',
  pending: 'bg-amber-100 text-amber-700',
  critical: 'bg-rose-100 text-rose-700',
  failed: 'bg-rose-100 text-rose-700',
  error: 'bg-rose-100 text-rose-700',
  paused: 'bg-slate-200 text-slate-600',
  draft: 'bg-slate-200 text-slate-600',
  'no audience': 'bg-amber-100 text-amber-700',
  no_audience: 'bg-amber-100 text-amber-700',
  default: 'bg-slate-200 text-slate-600',
};

const formatStatusLabel = (status) => {
  if (!status) return '';
  return String(status).replace(/_/g, ' ');
};

const formatTimestamp = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
  } catch (error) {
    return parsed.toLocaleString();
  }
};

const StatusPill = ({ status, children }) => {
  if (!status) {
    return null;
  }
  const normalized = typeof status === 'string' ? status.toLowerCase() : '';
  const tone = STATUS_TONE_MAP[normalized] ?? STATUS_TONE_MAP[formatStatusLabel(normalized)] ?? STATUS_TONE_MAP.default;
  const baseLabel = children ?? formatStatusLabel(status);
  const label = typeof baseLabel === 'string' && children == null ? baseLabel.toUpperCase() : baseLabel;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {label || 'UNKNOWN'}
    </span>
  );
};

StatusPill.propTypes = {
  status: PropTypes.string,
  children: PropTypes.node,
};

StatusPill.defaultProps = {
  status: null,
  children: null,
};

const UploadStatus = ({ isUploading, uploadError, lastUploadSummary }) => {
  if (isUploading) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        Processing upload…
      </div>
    );
  }

  if (uploadError) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
        {uploadError}
      </div>
    );
  }

  if (lastUploadSummary) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        <span>Latest upload</span>
        <span className="hidden sm:inline">{lastUploadSummary.filename}</span>
        <span>
          {lastUploadSummary.acceptedRows.length} accepted / {lastUploadSummary.rejectedRows.length} rejected
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
      No uploads yet
    </div>
  );
};

UploadStatus.propTypes = {
  isUploading: PropTypes.bool,
  uploadError: PropTypes.string,
  lastUploadSummary: PropTypes.shape({
    filename: PropTypes.string,
    summary: PropTypes.string,
    totalRows: PropTypes.number,
    acceptedRows: PropTypes.arrayOf(PropTypes.object),
    rejectedRows: PropTypes.arrayOf(PropTypes.object),
    issues: PropTypes.objectOf(PropTypes.number),
  }),
};

UploadStatus.defaultProps = {
  isUploading: false,
  uploadError: null,
  lastUploadSummary: null,
};

const UploadSummaryDetails = ({ summary }) => {
  if (!summary) {
    return null;
  }

  const {
    summary: message,
    totalRows,
    acceptedRows = [],
    rejectedRows = [],
    issues = {},
  } = summary;

  const issueEntries = Object.entries(issues).sort(([, a], [, b]) => b - a);
  const rejectedPreview = rejectedRows.slice(0, 5);
  const hasMoreRejected = rejectedRows.length > rejectedPreview.length;
  const formatIssueLabel = (issue) => ISSUE_LABELS[issue] ?? issue.replace(/_/g, ' ');

  return (
    <div className="mt-6 rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-sm">
      <h4 className="text-base font-semibold text-slate-700">Validation Summary</h4>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      <dl className="mt-4 grid gap-3 text-xs uppercase tracking-[0.2em] text-slate-500 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-100/70 p-4">
          <dt>Total rows</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-700">{totalRows}</dd>
        </div>
        <div className="rounded-2xl bg-emerald-100/70 p-4">
          <dt>Accepted</dt>
          <dd className="mt-1 text-lg font-semibold text-emerald-700">{acceptedRows.length}</dd>
        </div>
        <div className="rounded-2xl bg-amber-100/70 p-4">
          <dt>Rejected</dt>
          <dd className="mt-1 text-lg font-semibold text-amber-700">{rejectedRows.length}</dd>
        </div>
      </dl>

      {issueEntries.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Issue breakdown</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {issueEntries.map(([issue, count]) => (
              <li key={issue} className="flex items-center justify-between rounded-2xl bg-slate-100/60 px-3 py-2">
                <span className="font-medium text-slate-700">{formatIssueLabel(issue)}</span>
                <span className="text-xs font-semibold text-slate-500">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rejectedRows.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Sample rejected rows</p>
          <div className="mt-2 overflow-hidden rounded-2xl border border-rose-200/60">
            <table className="min-w-full border-collapse text-left text-xs text-slate-600">
              <thead className="bg-rose-50 text-[11px] uppercase tracking-[0.2em] text-rose-600">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">City ID</th>
                  <th className="px-3 py-2">Reasons</th>
                </tr>
              </thead>
              <tbody>
                {rejectedPreview.map((row) => (
                  <tr key={`${row.rowNumber}-${row.cityId}`} className="border-t border-rose-100">
                    <td className="px-3 py-2 font-semibold text-rose-600">{row.rowNumber}</td>
                    <td className="px-3 py-2 text-slate-700">{row.cityId || '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{row.reasons.map((reason) => formatIssueLabel(reason)).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMoreRejected && (
            <p className="mt-2 text-xs text-slate-500">Showing first {rejectedPreview.length} of {rejectedRows.length} rejected rows.</p>
          )}
        </div>
      )}
    </div>
  );
};

UploadSummaryDetails.propTypes = {
  summary: PropTypes.shape({
    summary: PropTypes.string,
    totalRows: PropTypes.number,
    acceptedRows: PropTypes.arrayOf(PropTypes.object),
    rejectedRows: PropTypes.arrayOf(PropTypes.shape({
      rowNumber: PropTypes.number,
      cityId: PropTypes.string,
      reasons: PropTypes.arrayOf(PropTypes.string),
    })),
    issues: PropTypes.objectOf(PropTypes.number),
  }),
};

UploadSummaryDetails.defaultProps = {
  summary: null,
};

export const ReportingPanel = ({
  onDownload,
  format,
  onFormatChange,
  scheduledReports,
  reportDispatchLog,
  onConfigureSchedule,
  scheduleError,
  measurementUploads,
  onUploadMeasurements,
  isUploading,
  uploadError,
  lastUploadSummary,
}) => {
  const hasScheduledReports = Array.isArray(scheduledReports) && scheduledReports.length > 0;
  const hasDispatchLog = Array.isArray(reportDispatchLog) && reportDispatchLog.length > 0;

  const handleConfigureSchedule = () => {
    if (typeof onConfigureSchedule === 'function') {
      onConfigureSchedule();
    }
  };

  return (
    <section id="reports" className="glass-panel p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gov-primary">Export & Reporting Center</h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure data extracts and scheduled reporting flows. Integrates with Supabase storage and headless browser services.
          </p>
        </div>
        <UploadStatus isUploading={isUploading} uploadError={uploadError} lastUploadSummary={lastUploadSummary} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Snapshot</p>
          <p className="mt-4 text-xl font-semibold text-slate-700">Download Live Dataset</p>
          <p className="mt-2 text-sm text-slate-600">Respect active filters from the situation room to export structured data.</p>
          <div className="mt-5 space-y-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="export-format"
                value="csv"
                checked={format === 'csv'}
                onChange={(event) => onFormatChange?.(event.target.value)}
              />
              CSV
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="export-format"
                value="json"
                checked={format === 'json'}
                onChange={(event) => onFormatChange?.(event.target.value)}
              />
              JSON
            </label>
          </div>
          <button
            type="button"
            onClick={() => onDownload?.(format)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gov-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gov-accent"
          >
            Download {format?.toUpperCase?.()}
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Automation</p>
          <p className="mt-4 text-xl font-semibold text-slate-700">Schedule Delivery</p>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder hook for Supabase cron jobs or external orchestration. Extend with cadence + audience inputs.
          </p>
          <button
            type="button"
            onClick={handleConfigureSchedule}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm transition hover:text-gov-primary"
          >
            Configure Schedule
          </button>
          {scheduleError && (
            <p className="mt-2 text-xs font-semibold text-rose-600">
              {scheduleError}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Policy Brief</p>
          <p className="mt-4 text-xl font-semibold text-slate-700">Build executive summary</p>
          <p className="mt-2 text-sm text-slate-600">
            Use the trend and intelligence panels to annotate insights before exporting a formatted report.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gov-primary shadow-sm"
          >
            Launch Builder
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <h3 className="text-lg font-semibold text-slate-700">Scheduled Reports</h3>
          <ul className="mt-4 space-y-4 text-sm text-slate-600">
            {hasScheduledReports ? (
              scheduledReports.map((item) => {
                const reportId = item.id ?? item.name;
                const cadenceDetails = [item.cadence || 'Cadence pending', item.audience || 'Audience unassigned']
                  .filter(Boolean)
                  .join(' · ');
                const lastRunLabel = formatTimestamp(item.lastRunAt);
                const deliveredLabel = formatTimestamp(item.lastDeliveredAt);
                const lastStatusKey = item.lastStatus ?? item.status ?? 'status';
                const lastStatusLabel = formatStatusLabel(lastStatusKey);

                return (
                  <li key={reportId} className="rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-700">{item.name ?? 'Automated Subscription'}</p>
                        <p className="text-xs text-slate-500">{cadenceDetails}</p>
                      </div>
                      <StatusPill status={item.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span title={item.lastRunAt ?? undefined}>
                        Last run:{' '}
                        <span className="font-semibold text-slate-600">
                          {lastRunLabel ?? 'Not yet triggered'}
                        </span>
                      </span>
                      <StatusPill status={item.lastStatus ?? item.status}>
                        {`Last ${lastStatusLabel || 'status'}`.toUpperCase()}
                      </StatusPill>
                      {deliveredLabel && (
                        <span title={item.lastDeliveredAt ?? undefined} className="flex items-center gap-2 text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Delivered {deliveredLabel}
                        </span>
                      )}
                    </div>
                    {item.lastError && (
                      <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-rose-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        {item.lastError}
                      </p>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="rounded-2xl bg-slate-100/70 px-4 py-5 text-xs text-slate-500">
                No scheduled reports configured yet. Connect Supabase subscriptions or dispatch logs to populate this list.
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6 text-sm text-slate-600">
          <h3 className="text-lg font-semibold text-slate-700">Recent Dispatches</h3>
          <ul className="mt-4 space-y-3">
            {hasDispatchLog ? (
              reportDispatchLog.slice(0, 6).map((entry) => {
                const statusLabel = formatStatusLabel(entry.status ?? 'queued');
                return (
                  <li key={entry.id} className="rounded-2xl bg-slate-100/70 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-700">{entry.summary?.subscription?.name ?? 'Automated dispatch'}</p>
                        <p className="text-xs text-slate-500">
                          {formatTimestamp(entry.createdAt) ?? 'Queued'}
                          {entry.audience ? ` · ${entry.audience}` : ''}
                        </p>
                      </div>
                      <StatusPill status={entry.status}>{statusLabel.toUpperCase()}</StatusPill>
                    </div>
                    {entry.errorMessage && (
                      <p className="mt-2 text-xs font-semibold text-rose-600">
                        {entry.errorMessage}
                      </p>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="rounded-2xl bg-slate-100/70 px-4 py-5 text-xs text-slate-500">
                Dispatch history will appear once the automation runs. Trigger the Supabase function or scheduler to populate this feed.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-700">Measurement Ingestion</h3>
              <p className="text-sm text-slate-500">Upload field CSVs to queue validation and distribution.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gov-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gov-accent">
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onUploadMeasurements?.(file);
                    event.target.value = '';
                  }
                }}
              />
              Upload CSV
            </label>
          </div>

          <div className="mt-4 space-y-3 text-xs text-slate-500">
            <p>Template columns: <span className="font-semibold text-slate-700">city_id, aqi, pollutant, timestamp</span>.</p>
            <p>Automatic validation ensures accurate AQI ranges and known city identifiers.</p>
            <p>Supports UTF-8 CSV files up to 2 MB (~5,000 rows) to keep validation responsive.</p>
          </div>

          <UploadSummaryDetails summary={lastUploadSummary} />
        </div>

        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <h3 className="text-lg font-semibold text-slate-700">Upload Activity</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {(measurementUploads.length ? measurementUploads : lastUploadSummary ? [lastUploadSummary] : [])
              .slice(0, 6)
              .map((item) => (
                <li
                  key={item.id ?? item.filename}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-100/70 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-700">{item.filename ?? 'Manual upload'}</p>
                    <p className="text-xs text-slate-500">
                      {item.summary ?? `${item.acceptedRows} accepted / ${item.rejectedRows} rejected`}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === 'complete'
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.status === 'partial'
                          ? 'bg-amber-100 text-amber-700'
                          : item.status === 'failed'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {(item.status ?? 'queued').toUpperCase()}
                  </span>
                </li>
              ))}
            {!measurementUploads.length && !lastUploadSummary && (
              <li className="rounded-2xl bg-slate-100/70 px-4 py-3 text-xs text-slate-500">
                Measurement uploads will appear here once processed.
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};

ReportingPanel.propTypes = {
  onDownload: PropTypes.func,
  format: PropTypes.oneOf(['csv', 'json']).isRequired,
  onFormatChange: PropTypes.func,
  scheduledReports: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      cadence: PropTypes.string,
      audience: PropTypes.string,
      status: PropTypes.string,
      lastRunAt: PropTypes.string,
      lastStatus: PropTypes.string,
      lastDeliveredAt: PropTypes.string,
      lastError: PropTypes.string,
    }),
  ),
  reportDispatchLog: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      subscriptionId: PropTypes.string,
      status: PropTypes.string,
      createdAt: PropTypes.string,
      deliveredAt: PropTypes.string,
      errorMessage: PropTypes.string,
      audience: PropTypes.string,
      summary: PropTypes.object,
    }),
  ),
  onConfigureSchedule: PropTypes.func,
  scheduleError: PropTypes.string,
  measurementUploads: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      filename: PropTypes.string,
      status: PropTypes.string,
      totalRows: PropTypes.number,
      acceptedRows: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),
      rejectedRows: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),
      summary: PropTypes.string,
    }),
  ),
  onUploadMeasurements: PropTypes.func,
  isUploading: PropTypes.bool,
  uploadError: PropTypes.string,
  lastUploadSummary: PropTypes.shape({
    filename: PropTypes.string,
    acceptedRows: PropTypes.arrayOf(PropTypes.object),
    rejectedRows: PropTypes.arrayOf(PropTypes.object),
    summary: PropTypes.string,
    status: PropTypes.string,
  }),
};

ReportingPanel.defaultProps = {
  onDownload: undefined,
  onFormatChange: undefined,
  scheduledReports: [],
  reportDispatchLog: [],
  onConfigureSchedule: undefined,
  scheduleError: null,
  measurementUploads: [],
  onUploadMeasurements: undefined,
  isUploading: false,
  uploadError: null,
  lastUploadSummary: null,
};
