const TREND_WINDOWS = [
  {
    label: "24 Hours",
    delta: "+4.2%",
    status: "Warning",
    copy: "Regional smog event linked to thermal power output.",
  },
  {
    label: "7 Days",
    delta: "-2.1%",
    status: "Improving",
    copy: "Wind patterns dispersing particulate build-up across western corridor.",
  },
  {
    label: "30 Days",
    delta: "+1.7%",
    status: "Stable",
    copy: "Seasonal baselines aligning with historical averages.",
  },
];

export const HistoricalTrendsPanel = () => (
  <section id="historical-trends" className="glass-panel p-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-gov-primary">Historical Trend Analysis</h2>
        <p className="mt-1 text-sm text-slate-500">
          Compare high-value windows to detect policy impacts and emerging hotspots over time.
        </p>
      </div>
      <div className="inline-flex gap-2 rounded-full bg-gov-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gov-primary">
        Data Integrity · 98.7%
      </div>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {TREND_WINDOWS.map((window) => (
        <div key={window.label} className="rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{window.label}</p>
          <p className="mt-4 text-3xl font-semibold text-gov-primary">{window.delta}</p>
          <p className="mt-2 text-sm text-slate-500">{window.copy}</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <span className="h-2 w-2 rounded-full bg-gov-accent" />
            {window.status}
          </span>
        </div>
      ))}
    </div>

    <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
        <h3 className="text-lg font-semibold text-slate-700">AQI Trajectory (Delhi NCR)</h3>
        <div className="mt-4 h-64 rounded-2xl bg-gradient-to-br from-gov-muted to-white/80">
          <div className="flex h-full flex-col justify-between p-6 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>24h</span>
              <span>18h</span>
              <span>12h</span>
              <span>6h</span>
              <span>Now</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-gov-primary shadow">
                Forecast overlay ready
              </span>
            </div>
            <div className="flex justify-between">
              <span>AQI 80</span>
              <span>120</span>
              <span>160</span>
              <span>220</span>
              <span>260</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
        <h3 className="text-lg font-semibold text-slate-700">Policy Impact Watchlist</h3>
        <ul className="mt-4 space-y-4 text-sm text-slate-600">
          <li className="rounded-2xl bg-slate-100/60 p-4">
            <p className="font-semibold text-slate-700">Odd-Even Pilot · Delhi</p>
            <p className="mt-1 text-xs text-slate-500">Net gain of 6.4% improvement in PM2.5 within 7 days.</p>
          </li>
          <li className="rounded-2xl bg-slate-100/60 p-4">
            <p className="font-semibold text-slate-700">Industrial curfew · Raipur</p>
            <p className="mt-1 text-xs text-slate-500">Immediate drop of 12% in SO₂ following enforcement.</p>
          </li>
          <li className="rounded-2xl bg-slate-100/60 p-4">
            <p className="font-semibold text-slate-700">Port emissions cap · Mumbai</p>
            <p className="mt-1 text-xs text-slate-500">Monitoring for rebound effect. Awaiting second-week data.</p>
          </li>
        </ul>
      </div>
    </div>
  </section>
);
