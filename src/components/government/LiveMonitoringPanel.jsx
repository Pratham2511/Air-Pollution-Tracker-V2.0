const SAMPLE_ROWS = [
  {
    city: "Delhi NCR, IN",
    aqi: 312,
    dominant: "PM2.5",
    change: "+18",
    status: "Hazard",
  },
  {
    city: "Mumbai, IN",
    aqi: 168,
    dominant: "PM10",
    change: "+7",
    status: "Alert",
  },
  {
    city: "Bengaluru, IN",
    aqi: 88,
    dominant: "O₃",
    change: "-5",
    status: "Stable",
  },
  {
    city: "Chennai, IN",
    aqi: 142,
    dominant: "NO₂",
    change: "+3",
    status: "Watch",
  },
];

const statusStyles = {
  Hazard: "bg-rose-100 text-rose-700 border-rose-200",
  Alert: "bg-amber-100 text-amber-700 border-amber-200",
  Watch: "bg-sky-100 text-sky-700 border-sky-200",
  Stable: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const LiveMonitoringPanel = () => (
  <section id="live-monitoring" className="glass-panel p-8">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
      <div>
        <h2 className="text-2xl font-semibold text-gov-primary">Live AQI Situation Room</h2>
        <p className="mt-1 text-sm text-slate-500">
          Real-time feed refreshed every 5 minutes. Hazard levels are escalated to the central command bus.
        </p>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Network Healthy
        </span>
        <span>Last sync · 2 mins ago</span>
      </div>
    </div>

    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-3 pr-6 font-semibold">City</th>
            <th className="py-3 pr-6 font-semibold">AQI</th>
            <th className="py-3 pr-6 font-semibold">Dominant Pollutant</th>
            <th className="py-3 pr-6 font-semibold">Δ last hour</th>
            <th className="py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {SAMPLE_ROWS.map((row) => (
            <tr key={row.city} className="text-slate-700">
              <td className="py-4 pr-6">
                <div className="font-semibold text-slate-800">{row.city}</div>
                <div className="text-xs text-slate-500">City network · Tier-I</div>
              </td>
              <td className="py-4 pr-6 text-lg font-semibold text-slate-800">{row.aqi}</td>
              <td className="py-4 pr-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {row.dominant}
                </span>
              </td>
              <td className="py-4 pr-6">
                <span className={`font-semibold ${row.change.startsWith("-") ? "text-emerald-600" : "text-rose-600"}`}>
                  {row.change}
                </span>
              </td>
              <td className="py-4">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[row.status]}`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
