const REPORT_OPTIONS = [
  {
    title: "CSV Export",
    description: "Download filtered AQI snapshots for offline analysis.",
    meta: "Ready",
  },
  {
    title: "JSON Stream",
    description: "Pipe live feed into downstream data pipelines.",
    meta: "Webhook",
  },
  {
    title: "Policy Brief",
    description: "Generate executive summary PDF with highlights.",
    meta: "Beta",
  },
];

export const ReportingPanel = () => (
  <section id="reports" className="glass-panel p-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-gov-primary">Export & Reporting Center</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure data extracts and scheduled reporting flows. Integrates with Supabase storage and headless browser services.
        </p>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full bg-gov-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gov-accent">
        Automation Pipeline
      </div>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {REPORT_OPTIONS.map((option) => (
        <div key={option.title} className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{option.meta}</p>
          <p className="mt-4 text-xl font-semibold text-slate-700">{option.title}</p>
          <p className="mt-2 text-sm text-slate-600">{option.description}</p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gov-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gov-accent"
          >
            Configure
            <span className="inline-block h-1 w-1 rounded-full bg-white" />
          </button>
        </div>
      ))}
    </div>

    <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
        <h3 className="text-lg font-semibold text-slate-700">Scheduled Reports</h3>
        <ul className="mt-4 space-y-4 text-sm text-slate-600">
          <li className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-700">Daily AQI Digest</p>
              <p className="text-xs text-slate-500">Delivered 07:00 IST · 35 recipients</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
          </li>
          <li className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-700">Weekly Policy Brief</p>
              <p className="text-xs text-slate-500">Delivered Mondays 09:00 IST · 12 recipients</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Queued</span>
          </li>
          <li className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-700">Incident Escalation</p>
              <p className="text-xs text-slate-500">Triggers when AQI &gt; 350 for &gt; 30 mins</p>
            </div>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Critical</span>
          </li>
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
  </section>
);
