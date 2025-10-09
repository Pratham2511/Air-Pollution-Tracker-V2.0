const INTELLIGENCE_CARDS = [
  {
    title: "Dominant Pollutant",
    value: "PM2.5",
    meta: "Detected across 62% of national stations",
    chip: "Critical",
  },
  {
    title: "Primary Source",
    value: "Vehicular Emissions",
    meta: "Peak influence during 7-10 AM & 6-9 PM windows",
    chip: "Mobility",
  },
  {
    title: "Secondary Source",
    value: "Construction Dust",
    meta: "High correlation in western corridor (r = 0.78)",
    chip: "Infrastructure",
  },
];

const DOMINANCE_MATRIX = [
  { pollutant: "PM2.5", share: 54, classification: "Severe" },
  { pollutant: "PM10", share: 22, classification: "High" },
  { pollutant: "NO₂", share: 11, classification: "Moderate" },
  { pollutant: "O₃", share: 7, classification: "Low" },
  { pollutant: "SO₂", share: 4, classification: "Low" },
  { pollutant: "CO", share: 2, classification: "Minimal" },
];

export const PollutantIntelligencePanel = () => (
  <section id="pollutant-intel" className="glass-panel p-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-gov-primary">Pollutant Intelligence Desk</h2>
        <p className="mt-1 text-sm text-slate-500">
          Consolidated attribution dashboard aligning surface measurements with satellite telemetry and policy levers.
        </p>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full bg-gov-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gov-accent">
        Attribution Engine v1.3β
      </div>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {INTELLIGENCE_CARDS.map((card) => (
        <article key={card.title} className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{card.title}</p>
          <p className="mt-4 text-3xl font-semibold text-gov-primary">{card.value}</p>
          <p className="mt-2 text-sm text-slate-600">{card.meta}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <span className="h-2 w-2 rounded-full bg-gov-primary" />
            {card.chip}
          </span>
        </article>
      ))}
    </div>

    <div className="mt-8 grid gap-6 lg:grid-cols-[1.75fr_1fr]">
      <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
        <h3 className="text-lg font-semibold text-slate-700">Dominance Matrix</h3>
        <div className="mt-4 space-y-3">
          {DOMINANCE_MATRIX.map((row) => (
            <div key={row.pollutant} className="flex items-center gap-4">
              <span className="w-20 text-sm font-semibold text-slate-600">{row.pollutant}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-gov-primary to-gov-accent`}
                  style={{ width: `${row.share}%` }}
                />
              </div>
              <span className="w-16 text-xs font-semibold text-slate-500">{row.share}%</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                {row.classification}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
        <h3 className="text-lg font-semibold text-slate-700">Source Attribution Notes</h3>
        <ul className="mt-4 space-y-4 text-sm text-slate-600">
          <li className="rounded-2xl bg-slate-100/70 p-4">
            <p className="font-semibold text-slate-700">Thermal power corridor</p>
            <p className="mt-1 text-xs text-slate-500">Correlated SO₂ spikes on weekday evenings. Recommend real-time stack monitoring.</p>
          </li>
          <li className="rounded-2xl bg-slate-100/70 p-4">
            <p className="font-semibold text-slate-700">Construction clusters</p>
            <p className="mt-1 text-xs text-slate-500">Deploy dust suppression audits. 38% of sensors exceed PM limits.</p>
          </li>
          <li className="rounded-2xl bg-slate-100/70 p-4">
            <p className="font-semibold text-slate-700">Traffic choke-points</p>
            <p className="mt-1 text-xs text-slate-500">Adaptive signal program scheduled for pilot roll-out in Q4.</p>
          </li>
        </ul>
      </div>
    </div>
  </section>
);
