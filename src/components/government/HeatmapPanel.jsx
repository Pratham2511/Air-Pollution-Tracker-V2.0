export const HeatmapPanel = () => (
  <section id="heatmap" className="glass-panel p-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-gov-primary">Heatmap Visualization</h2>
        <p className="mt-1 text-sm text-slate-500">
          Leaflet heat layer placeholder. Plug in Supabase spatial API or raster overlays to activate.
        </p>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full bg-gov-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gov-primary">
        GeoStack Ready
      </div>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_1fr]">
      <div className="relative h-96 overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-gov-primary/20 via-white to-gov-accent/20">
        <div className="absolute inset-0">
          <div className="absolute left-10 top-16 h-24 w-24 rounded-full bg-rose-500/40 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 h-32 w-32 -translate-x-1/2 rounded-full bg-amber-400/40 blur-3xl" />
          <div className="absolute bottom-12 right-16 h-28 w-28 rounded-full bg-emerald-400/40 blur-3xl" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 text-center">
          <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gov-primary">
            Heat signatures
          </span>
          <p className="max-w-sm text-sm text-slate-600">
            Integrate with Leaflet heat layer to render high-density pollutant concentrations with gradient overlays.
          </p>
        </div>
      </div>

      <div className="space-y-4 text-sm text-slate-600">
        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Gradient Legend</p>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center gap-3">
              <span className="h-2 w-10 rounded-full bg-rose-500/60" />
              <span>Critical hotspot (AQI &gt; 300)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-10 rounded-full bg-amber-400/60" />
              <span>Emerging hotspot (AQI 200-300)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-10 rounded-full bg-emerald-400/60" />
              <span>Stabilizing zone (AQI &lt; 150)</span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Next Steps</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-xs">
            <li>Wire heatmap layer with Supabase Edge Function for aggregated tiles.</li>
            <li>Add custom gradient legend synced with AQI thresholds.</li>
            <li>Enable draw tools for marking emergent response zones.</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);
