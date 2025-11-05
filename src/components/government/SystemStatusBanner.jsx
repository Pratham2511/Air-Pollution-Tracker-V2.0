import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { MAPBOX_GUARDRAIL_EVENT, MAPBOX_GUARDRAIL_STORAGE_KEY } from '../../hooks/useMapboxGuardrail';

const LEVEL_STYLES = {
  critical: {
    badge: 'Critical',
    pillClass: 'bg-red-500/10 text-red-600',
    borderClass: 'border-red-500/70',
    messageClass: 'text-red-700',
  },
  warning: {
    badge: 'Warning',
    pillClass: 'bg-amber-400/10 text-amber-600',
    borderClass: 'border-amber-500/70',
    messageClass: 'text-amber-700',
  },
  info: {
    badge: 'Info',
    pillClass: 'bg-sky-400/10 text-sky-600',
    borderClass: 'border-sky-500/60',
    messageClass: 'text-sky-700',
  },
  default: {
    badge: 'Notice',
    pillClass: 'bg-slate-200 text-slate-600',
    borderClass: 'border-slate-300',
    messageClass: 'text-slate-700',
  },
};

const formatGuardrailUsage = (guardrail) => {
  if (!guardrail) {
    return null;
  }

  const maxLoads = typeof guardrail.maxMonthlyLoads === 'number' && guardrail.maxMonthlyLoads > 0
    ? guardrail.maxMonthlyLoads
    : 1000;
  const loads = Number.isFinite(guardrail.loads) ? Math.max(0, guardrail.loads) : 0;
  const remaining = Number.isFinite(guardrail.remaining) ? Math.max(0, guardrail.remaining) : null;
  const used = remaining != null ? Math.min(maxLoads, Math.max(0, maxLoads - remaining)) : loads;
  const percent = maxLoads > 0 ? Math.min(100, Math.max(0, (used / maxLoads) * 100)) : 0;
  const statusLabel = guardrail.reason === 'quota-exceeded'
    ? 'Interactive map paused'
    : guardrail.reason === 'save-data'
      ? 'Data saver mode active'
      : guardrail.canUseMap === false
        ? 'Interactive map disabled'
        : 'Interactive map active';

  return {
    maxLoads,
    used,
    remaining,
    percent,
    statusLabel,
  };
};

export const SystemStatusBanner = ({ alerts, guardrail }) => {
  const usage = formatGuardrailUsage(guardrail);
  const hasAlerts = alerts.length > 0;
  const isDevelopment = process.env.NODE_ENV === 'development';

  const broadcastGuardrailEvent = useCallback((detail) => {
    if (typeof window === 'undefined') {
      return;
    }

    const snapshot = {
      monthKey: detail.monthKey ?? new Date().toISOString().slice(0, 7),
      maxMonthlyLoads: typeof detail.maxMonthlyLoads === 'number' ? detail.maxMonthlyLoads : 1000,
      loads: Number.isFinite(detail.loads) ? Math.max(0, detail.loads) : 0,
      remaining: Number.isFinite(detail.remaining) ? Math.max(0, detail.remaining) : null,
      canUseMap: typeof detail.canUseMap === 'boolean' ? detail.canUseMap : true,
      reason: detail.reason ?? 'unknown',
    };

    try {
      window.localStorage.setItem(MAPBOX_GUARDRAIL_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist guardrail snapshot for dev tooling.', error);
    }

    window.dispatchEvent(new CustomEvent(MAPBOX_GUARDRAIL_EVENT, { detail: snapshot }));
  }, []);

  const handleSimulateQuota = useCallback(() => {
    broadcastGuardrailEvent({
      loads: 1000,
      remaining: 0,
      maxMonthlyLoads: 1000,
      reason: 'quota-exceeded',
      canUseMap: false,
    });
  }, [broadcastGuardrailEvent]);

  const handleSimulateBudgetLow = useCallback(() => {
    broadcastGuardrailEvent({
      loads: 920,
      remaining: 80,
      maxMonthlyLoads: 1000,
      reason: 'usage-monitoring',
      canUseMap: true,
    });
  }, [broadcastGuardrailEvent]);

  const handleResetGuardrail = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(MAPBOX_GUARDRAIL_STORAGE_KEY);
    }
    broadcastGuardrailEvent({
      loads: 0,
      remaining: null,
      reason: 'unknown',
      canUseMap: true,
    });
  }, [broadcastGuardrailEvent]);

  return (
    <section
      id="system-status"
      className="glass-panel space-y-4 p-6"
      aria-live="polite"
      aria-label="System status alerts"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">System Status</p>
          <h2 className="text-xl font-semibold text-gov-primary">Operational Telemetry & Alerts</h2>
        </div>
        {usage && (
          <span className="inline-flex items-center gap-2 rounded-full bg-gov-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gov-primary">
            {usage.statusLabel}
          </span>
        )}
      </div>

      {usage ? (
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4">
          <div className="flex flex-wrap items-end justify-between gap-2 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-700">Mapbox usage this month</p>
              <p className="text-xs text-slate-500">
                {usage.used} of {usage.maxLoads} allocated tile loads consumed
                {usage.remaining != null ? ` · ${usage.remaining} remaining` : ''}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {Math.round(usage.percent)}%
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-gov-primary transition-all"
              style={{ width: `${usage.percent}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/70 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Mapbox telemetry pending</p>
          <p className="mt-1 text-xs text-slate-500">
            Interactive map usage data will appear after the first guardrail event is recorded this cycle.
          </p>
        </div>
      )}

      {hasAlerts ? (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const level = LEVEL_STYLES[alert.level] ?? LEVEL_STYLES.default;
            return (
              <div
                key={alert.id}
                className={`rounded-3xl border-l-4 bg-white/90 p-5 shadow-sm ${level.borderClass}`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] ${level.pillClass}`}>
                    {level.badge}
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${level.messageClass}`}>{alert.message}</p>
                    {alert.detail && (
                      <p className="mt-1 text-xs text-slate-500">{alert.detail}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200/60 bg-white/80 p-5 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">All systems operating within expected thresholds.</p>
          <p className="mt-1 text-xs text-slate-500">Alerts will surface here automatically if data refreshes fail or the Mapbox budget degrades.</p>
        </div>
      )}

      {isDevelopment && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">Developer quick actions</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-slate-400">Simulate guardrail scenarios locally</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSimulateQuota}
              className="rounded-full border border-red-500/50 bg-red-500/10 px-3 py-2 font-semibold uppercase tracking-[0.25em] text-red-600 transition hover:bg-red-500/20"
            >
              Simulate Quota Exhausted
            </button>
            <button
              type="button"
              onClick={handleSimulateBudgetLow}
              className="rounded-full border border-amber-500/50 bg-amber-400/10 px-3 py-2 font-semibold uppercase tracking-[0.25em] text-amber-600 transition hover:bg-amber-400/20"
            >
              Simulate Budget Low
            </button>
            <button
              type="button"
              onClick={handleResetGuardrail}
              className="rounded-full border border-slate-300 bg-white px-3 py-2 font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:text-gov-primary"
            >
              Reset Guardrail State
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

SystemStatusBanner.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      level: PropTypes.string,
      message: PropTypes.string.isRequired,
      detail: PropTypes.string,
    }),
  ),
  guardrail: PropTypes.shape({
    loads: PropTypes.number,
    remaining: PropTypes.number,
    reason: PropTypes.string,
    maxMonthlyLoads: PropTypes.number,
    canUseMap: PropTypes.bool,
  }),
};

SystemStatusBanner.defaultProps = {
  alerts: [],
  guardrail: null,
};
