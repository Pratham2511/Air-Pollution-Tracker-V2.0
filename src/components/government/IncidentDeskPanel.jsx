import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

const severityBadge = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-sky-100 text-sky-700',
};

const humanizeAction = (action) =>
  (action ?? '')
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (error) {
    return timestamp;
  }
};

export const IncidentDeskPanel = ({
  incidents,
  incidentActivity,
  incidentActivityByIncident,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [form, setForm] = useState({
    title: '',
    severity: 'medium',
    summary: '',
    tags: '',
  });

  const [creating, setCreating] = useState(false);
  const [timelineIncidentId, setTimelineIncidentId] = useState('all');

  useEffect(() => {
    if (timelineIncidentId === 'all') {
      return;
    }
    const stillExists = incidents.some((incident) => incident.id === timelineIncidentId);
    if (!stillExists) {
      setTimelineIncidentId('all');
    }
  }, [incidents, timelineIncidentId]);

  const timelineOptions = useMemo(
    () => [
      { value: 'all', label: 'All incidents' },
      ...incidents.map((incident) => ({ value: incident.id, label: incident.title })),
    ],
    [incidents],
  );

  const timelineEntries = useMemo(() => {
    const source = timelineIncidentId === 'all'
      ? incidentActivity
      : incidentActivityByIncident[timelineIncidentId] ?? [];

    return [...source]
      .sort((a, b) => new Date(b.recorded_at ?? b.created_at ?? 0) - new Date(a.recorded_at ?? a.created_at ?? 0))
      .slice(0, 24);
  }, [incidentActivity, incidentActivityByIncident, timelineIncidentId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title || !form.summary) {
      return;
    }
    setCreating(true);
    await onCreate?.({
      title: form.title,
      summary: form.summary,
      severity: form.severity,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    });
    setForm({ title: '', severity: 'medium', summary: '', tags: '' });
    setCreating(false);
  };

  return (
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
          onClick={handleSubmit}
          disabled={creating || !form.title || !form.summary}
          className="inline-flex items-center gap-2 rounded-full bg-gov-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-gov-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? 'Logging…' : 'Log Incident'}
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
            <h3 className="text-lg font-semibold text-slate-700">Quick Entry</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Title
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="e.g. AQI Spike — Faridabad"
                  className="mt-2 h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-normal text-slate-600 shadow-sm focus:border-gov-primary focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Severity
                <select
                  value={form.severity}
                  onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value }))}
                  className="mt-2 h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-normal text-slate-600 shadow-sm focus:border-gov-primary focus:outline-none"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <label className="md:col-span-2 flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Summary
                <textarea
                  value={form.summary}
                  onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
                  rows={3}
                  placeholder="Provide operational notes, e.g. suspected source, response team"
                  className="mt-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-600 shadow-sm focus:border-gov-primary focus:outline-none"
                />
              </label>
              <label className="md:col-span-2 flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Tags
                <input
                  value={form.tags}
                  onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                  placeholder="Comma separated e.g. AQI, Field Ops"
                  className="mt-2 h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-normal text-slate-600 shadow-sm focus:border-gov-primary focus:outline-none"
                />
              </label>
            </div>
            <button
              type="submit"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gov-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gov-accent disabled:cursor-not-allowed disabled:opacity-60"
              disabled={creating || !form.title || !form.summary}
            >
              {creating ? 'Logging…' : 'Submit Incident'}
            </button>
          </form>

          <div className="space-y-4">
            {incidents.length ? (
              incidents.map((incident) => (
                <article key={incident.id} className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-700">{incident.title}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        severityBadge[incident.severity?.toLowerCase?.()] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {incident.severity?.toUpperCase?.() ?? incident.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(incident.createdAt).toLocaleString()} · Assigned to {incident.assignedTo ?? 'Operations'}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">{incident.summary}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                      Status: {incident.status ?? 'open'}
                    </span>
                    {(incident.tags ?? []).map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                    <button
                      type="button"
                      onClick={() => onUpdate?.({ id: incident.id, status: incident.status === 'resolved' ? 'open' : 'resolved' })}
                      className="rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm transition hover:text-gov-primary"
                    >
                      {incident.status === 'resolved' ? 'Reopen' : 'Resolve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(incident.id)}
                      className="rounded-full bg-white px-3 py-1 text-rose-600 shadow-sm transition hover:bg-rose-50"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimelineIncidentId(incident.id)}
                      className="rounded-full bg-white px-3 py-1 text-gov-primary shadow-sm transition hover:bg-gov-primary/10"
                    >
                      View Timeline
                    </button>
                  </div>
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Recent Activity</p>
                    <ul className="mt-3 space-y-3">
                      {(incidentActivityByIncident[incident.id] ?? []).slice(0, 3).map((entry) => (
                        <li key={`${entry.id ?? entry.recorded_at}-${entry.event_action}`} className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-gov-primary" />
                          <div className="text-xs text-slate-600">
                            <p className="font-semibold text-slate-700">{humanizeAction(entry.event_action)}</p>
                            <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                              {formatTimestamp(entry.recorded_at ?? entry.created_at)}
                            </p>
                          </div>
                        </li>
                      ))}
                      {!(incidentActivityByIncident[incident.id] ?? []).length && (
                        <li className="text-xs text-slate-500">No logged activity yet.</li>
                      )}
                    </ul>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500">
                No incidents logged yet. Capture field intelligence and hazards here.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-700">Incident Activity Timeline</h3>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Audit trail of responses & escalations</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Focus
                <select
                  value={timelineIncidentId}
                  onChange={(event) => setTimelineIncidentId(event.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm focus:border-gov-primary focus:outline-none"
                >
                  {timelineOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <ol className="mt-4 space-y-4">
              {timelineEntries.length ? (
                timelineEntries.map((entry) => {
                  const key = `${entry.id ?? entry.recorded_at ?? Math.random()}-${entry.event_action}`;
                  const metadata = Object.entries(entry.context ?? {}).slice(0, 3);

                  return (
                    <li key={key} className="relative rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="mt-1 inline-flex h-3 w-3 flex-shrink-0 rounded-full bg-gov-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-700">{humanizeAction(entry.event_action)}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">{formatTimestamp(entry.recorded_at ?? entry.created_at)}</p>
                          {(entry.actor_role || entry.actor_id) && (
                            <p className="mt-2 text-xs text-slate-500">
                              {entry.actor_role ? `${entry.actor_role}` : 'Agent'}
                              {entry.actor_id ? ` · ${(entry.actor_id.slice?.(0, 6) ?? entry.actor_id)}` : ''}
                            </p>
                          )}
                          {metadata.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {metadata.map(([keyName, value]) => (
                                <span
                                  key={keyName}
                                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                                >
                                  {keyName}: {typeof value === 'string' ? value : JSON.stringify(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-500">
                  No activity recorded yet. Incident events will appear here automatically.
                </li>
              )}
            </ol>
          </section>

          <section className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
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
          </section>
        </div>
      </div>
    </section>
  );
};

IncidentDeskPanel.propTypes = {
  incidents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      severity: PropTypes.string,
      summary: PropTypes.string,
      status: PropTypes.string,
      createdAt: PropTypes.string,
      assignedTo: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  incidentActivity: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      incident_id: PropTypes.string,
      event_action: PropTypes.string,
      actor_id: PropTypes.string,
      actor_role: PropTypes.string,
      recorded_at: PropTypes.string,
      created_at: PropTypes.string,
      context: PropTypes.object,
    }),
  ),
  incidentActivityByIncident: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        incident_id: PropTypes.string,
        event_action: PropTypes.string,
        actor_id: PropTypes.string,
        actor_role: PropTypes.string,
        recorded_at: PropTypes.string,
        created_at: PropTypes.string,
        context: PropTypes.object,
      }),
    ),
  ),
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
};

IncidentDeskPanel.defaultProps = {
  incidents: [],
  incidentActivity: [],
  incidentActivityByIncident: {},
  onCreate: undefined,
  onUpdate: undefined,
  onDelete: undefined,
};
