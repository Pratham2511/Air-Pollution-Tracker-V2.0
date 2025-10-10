import PropTypes from 'prop-types';
import { useMemo } from 'react';

const severityBadge = {
  critical: 'bg-rose-100 text-rose-700',
  severe: 'bg-amber-100 text-amber-700',
  alert: 'bg-amber-50 text-amber-600',
  watch: 'bg-sky-100 text-sky-700',
  stable: 'bg-emerald-100 text-emerald-700',
};

const spikeBadge = {
  extreme: 'bg-rose-600 text-white',
  major: 'bg-rose-400 text-white',
  moderate: 'bg-amber-300 text-slate-800',
  steady: 'bg-slate-200 text-slate-600',
  cooldown: 'bg-emerald-200 text-emerald-700',
};

const momentumCopy = (momentum) => {
  if (momentum >= 60) return 'Critical surge';
  if (momentum >= 40) return 'Escalating rapidly';
  if (momentum >= 25) return 'Notable upswing';
  if (momentum <= -30) return 'Cooling down fast';
  if (momentum <= -10) return 'Gradual recovery';
  return 'Holding pattern';
};

export const HotspotDetectionPanel = ({ hotspots }) => {
  const insights = useMemo(() => {
    if (!hotspots.length) {
      return {
        headline: 'Monitoring stable across network',
        summary: 'No hotspot advisories triggered in the last update cycle.',
        metrics: [],
      };
    }

    const highest = hotspots[0];
    const spike = hotspots.find((item) => item.isSpike);
    const cooldown = hotspots.find((item) => item.spikeCategory === 'cooldown');

    const avgAqi = Math.round(
      hotspots.reduce((acc, item) => acc + (item.aqi ?? 0), 0) / hotspots.length,
    );

    return {
      headline: `${highest.city} leading AQI ${highest.aqi}`,
      summary: spike
        ? `${spike.city} showing ${momentumCopy(spike.momentum).toLowerCase()}.`
        : 'No major surges detected — continue proactive monitoring.',
      metrics: [
        {
          label: 'Average AQI (Top 10)',
          value: avgAqi,
        },
        {
          label: 'Active spike alerts',
          value: hotspots.filter((item) => item.isSpike).length,
        },
        {
          label: 'Cooldown regions',
          value: hotspots.filter((item) => item.spikeCategory === 'cooldown').length,
        },
      ],
      trailingNote: cooldown
        ? `${cooldown.city} trending downward — consider easing advisories.`
        : undefined,
    };
  }, [hotspots]);

  return (
    <section id="hotspots" className="glass-panel p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gov-primary">Hotspot Detection & Spike Alerts</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ranked AQI hotspots with surge momentum signals for rapid intervention planning.
          </p>
        </div>
        <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 shadow-sm">
          {hotspots.length ? `${hotspots.length} regions monitored` : 'No active hotspots'}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {hotspots.length ? (
            <ol className="space-y-4">
              {hotspots.map((hotspot) => (
                <li
                  key={hotspot.id ?? hotspot.city}
                  className="rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:border-gov-accent/50 hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gov-primary text-lg font-semibold text-white">
                        {hotspot.rank ?? '—'}
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-slate-700">{hotspot.city}</p>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                          AQI {hotspot.aqi} · {hotspot.state ?? 'Unknown state'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                          severityBadge[hotspot.severity] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {hotspot.severity}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                          spikeBadge[hotspot.spikeCategory] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {hotspot.spikeCategory}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-100/70 p-4 text-xs text-slate-600">
                      <p className="font-semibold uppercase tracking-[0.3em] text-slate-400">Momentum</p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">{momentumCopy(hotspot.momentum)}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-slate-400">Δ {hotspot.momentum >= 0 ? '+' : ''}{hotspot.momentum}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-100/70 p-4 text-xs text-slate-600">
                      <p className="font-semibold uppercase tracking-[0.3em] text-slate-400">Dominant Pollutant</p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">{hotspot.dominantPollutant ?? 'N/A'}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-slate-400">Status {hotspot.status ?? 'pending'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-100/70 p-4 text-xs text-slate-600">
                      <p className="font-semibold uppercase tracking-[0.3em] text-slate-400">Last Updated</p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {hotspot.updatedAt ? new Date(hotspot.updatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-slate-400">City ID {hotspot.cityId ?? '—'}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500">
              No hotspot alerts detected. Network remains within operational thresholds.
            </div>
          )}
        </div>

        <aside className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <h3 className="text-lg font-semibold text-slate-700">Command Insights</h3>
          <p className="mt-1 text-sm text-slate-500">{insights.summary}</p>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {insights.metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl bg-slate-100/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-700">{metric.value}</p>
              </div>
            ))}
            {insights.trailingNote && (
              <p className="rounded-2xl bg-gov-primary/10 p-4 text-xs text-gov-primary">
                {insights.trailingNote}
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

HotspotDetectionPanel.propTypes = {
  hotspots: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      city: PropTypes.string,
      cityId: PropTypes.string,
      state: PropTypes.string,
      aqi: PropTypes.number,
      delta: PropTypes.number,
      status: PropTypes.string,
      dominantPollutant: PropTypes.string,
      updatedAt: PropTypes.string,
      rank: PropTypes.number,
      severity: PropTypes.string,
      spikeCategory: PropTypes.string,
      isSpike: PropTypes.bool,
      momentum: PropTypes.number,
    }),
  ),
};

HotspotDetectionPanel.defaultProps = {
  hotspots: [],
};

export default HotspotDetectionPanel;
