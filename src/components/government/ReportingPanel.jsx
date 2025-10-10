import PropTypes from 'prop-types';

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
    acceptedRows: PropTypes.arrayOf(PropTypes.object),
    rejectedRows: PropTypes.arrayOf(PropTypes.object),
  }),
};

UploadStatus.defaultProps = {
  isUploading: false,
  uploadError: null,
  lastUploadSummary: null,
};

export const ReportingPanel = ({
  onDownload,
  format,
  onFormatChange,
  scheduledReports,
  measurementUploads,
  onUploadMeasurements,
  isUploading,
  uploadError,
  lastUploadSummary,
}) => (
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
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm transition hover:text-gov-primary"
        >
          Configure Schedule
        </button>
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
          {(scheduledReports.length ? scheduledReports : [
            {
              id: 'digest',
              name: 'Daily AQI Digest',
              cadence: '07:00 IST',
              audience: '35 recipients',
              status: 'active',
            },
          ]).map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-4 py-3">
              <div>
                <p className="font-semibold text-slate-700">{item.name}</p>
                <p className="text-xs text-slate-500">{item.cadence} · {item.audience}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : item.status === 'queued'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-600'
                }`}
              >
                {item.status?.toUpperCase?.() ?? 'DRAFT'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6 text-sm text-slate-600">
        <h3 className="text-lg font-semibold text-slate-700">Integration Checklist</h3>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Supabase storage bucket configured
          </li>
          <li className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Headless Chromium service connected
          </li>
          <li className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Webhook secret rotation scheduled
          </li>
          <li className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            Policy template localization pending
          </li>
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
        </div>
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
    }),
  ),
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
  measurementUploads: [],
  onUploadMeasurements: undefined,
  isUploading: false,
  uploadError: null,
  lastUploadSummary: null,
};
