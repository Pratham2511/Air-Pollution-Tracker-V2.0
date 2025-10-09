const INCIDENTS = [
  {
    title: "AQI Spike · Faridabad",
    severity: "High",
    time: "12 minutes ago",
    summary: "Sudden rise to AQI 348. Linked to industrial exhaust reports.",
  },
  {
    title: "Sensor Offline · Surat",
    severity: "Medium",
    time: "48 minutes ago",
    summary: "2 of 5 nodes offline. Field ops dispatched with backup sensors.",
  },
  {
    title: "Citizen Report · Lucknow",
    severity: "Low",
    time: "1 hour ago",
    summary: "Residents report odor near Gomti bridge. Awaiting validation.",
  },
];

const severityBadge = {
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-sky-100 text-sky-700",
};

export const IncidentDeskPanel = () => (
  <section id="incidents" className="glass-panel p-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-gov-primary">Incident Management Desk</h2>
        <p className="mt-1 text-sm text-slate-500">
          Track escalations, assign response teams, and maintain a live trail of mitigation actions.
        </p>
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-gov-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-gov-accent"
      >
        Log Incident
      </button>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        {INCIDENTS.map((incident) => (
          <article key={incident.title} className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-700">{incident.title}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityBadge[incident.severity]}`}>
                {incident.severity}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{incident.time}</p>
            <p className="mt-3 text-sm text-slate-600">{incident.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                Assigned: Ops Team Delta
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                SLA: 30 mins
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                Tags: AQI, Field Ops
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
        <h3 className="text-lg font-semibold text-slate-700">Response Playbooks</h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li className="rounded-2xl bg-slate-100/70 p-4">
            <p className="font-semibold text-slate-700">Hazardous AQI Protocol</p>
            <p className="mt-1 text-xs text-slate-500">Trigger public advisories, activate emergency traffic controls.</p>
          </li>
          <li className="rounded-2xl bg-slate-100/70 p-4">
            <p className="font-semibold text-slate-700">Sensor Downtime SOP</p>
            <p className="mt-1 text-xs text-slate-500">Auto-dispatch field technicians with calibrated spares.</p>
          </li>
          <li className="rounded-2xl bg-slate-100/70 p-4">
            <p className="font-semibold text-slate-700">Citizen Feedback Loop</p>
            <p className="mt-1 text-xs text-slate-500">Validate crowd-sourced reports with mobile monitoring units.</p>
          </li>
        </ul>
      </div>
    </div>
  </section>
);
