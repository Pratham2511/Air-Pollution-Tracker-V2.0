import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Not timestamped';
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (error) {
    return timestamp;
  }
};

const badgeColors = {
  critical: 'bg-rose-100 text-rose-700',
  alert: 'bg-amber-100 text-amber-700',
  info: 'bg-sky-100 text-sky-700',
};

const generateFallbackId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `note-${Math.random().toString(36).slice(2, 10)}`;
};

export const GovernmentNotesPanel = ({ notes }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { filteredNotes, tags } = useMemo(() => {
    const normalized = (notes ?? []).map((note) => ({
      id: note.id ?? note.title ?? note.created_at ?? generateFallbackId(),
      title: note.title ?? note.subject ?? 'Untitled Field Note',
      body: note.body ?? note.description ?? note.summary ?? '',
      category: note.category ?? note.type ?? 'info',
      author: note.author ?? note.created_by ?? note.owner ?? 'Unknown author',
      tags: Array.isArray(note.tags) ? note.tags : typeof note.tags === 'string' ? note.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      updatedAt: note.updated_at ?? note.created_at ?? note.timestamp ?? null,
    }));

    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? normalized.filter(
          (entry) =>
            entry.title.toLowerCase().includes(query)
            || entry.body.toLowerCase().includes(query)
            || entry.tags.some((tag) => tag.toLowerCase().includes(query)),
        )
      : normalized;

    const uniqueTags = Array.from(new Set(normalized.flatMap((entry) => entry.tags)));

    return {
      filteredNotes: filtered.sort(
        (a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0),
      ),
      tags: uniqueTags,
    };
  }, [notes, searchQuery]);

  return (
    <section id="notes" className="glass-panel p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gov-primary">Government Situation Room Notes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Briefings, field updates, and inter-agency advisories synced from the Supabase knowledge base.
          </p>
        </div>
        {notes.length > 0 && (
          <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 shadow-sm">
            {notes.length} entries
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex w-full items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 shadow-sm focus-within:border-gov-primary">
              <span className="text-slate-400">Search</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Filter by keyword, tag, or author"
                className="w-full bg-transparent text-sm font-medium text-slate-600 placeholder:text-slate-300 focus:outline-none"
              />
            </label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {filteredNotes.length ? (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <article key={note.id} className="rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-700">{note.title}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                        badgeColors[note.category?.toLowerCase?.()] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {note.category}
                    </span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                    {formatTimestamp(note.updatedAt)} · {note.author}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                    {note.body || 'No description provided.'}
                  </p>
                  {note.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      {note.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500">
              {notes.length
                ? 'No notes match the current filter. Try adjusting the search keywords.'
                : 'No notes have been published yet. Once Supabase notes are added, they will appear here automatically.'}
            </div>
          )}
        </div>

        <aside className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <h3 className="text-lg font-semibold text-slate-700">Briefing Checklist</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="rounded-2xl bg-slate-100/70 p-4">
              <p className="font-semibold text-slate-700">Sync with Operations</p>
              <p className="mt-1 text-xs text-slate-500">Ensure field teams acknowledge new advisories within 30 minutes.</p>
            </li>
            <li className="rounded-2xl bg-slate-100/70 p-4">
              <p className="font-semibold text-slate-700">Policy Alignment</p>
              <p className="mt-1 text-xs text-slate-500">Route high-severity alerts to policy leads for situational assessment.</p>
            </li>
            <li className="rounded-2xl bg-slate-100/70 p-4">
              <p className="font-semibold text-slate-700">Citizen Comms</p>
              <p className="mt-1 text-xs text-slate-500">Coordinate citizen advisories with the public outreach team.</p>
            </li>
          </ul>
        </aside>
      </div>
    </section>
  );
};

GovernmentNotesPanel.propTypes = {
  notes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      body: PropTypes.string,
      description: PropTypes.string,
      summary: PropTypes.string,
      category: PropTypes.string,
      type: PropTypes.string,
      author: PropTypes.string,
      created_by: PropTypes.string,
      owner: PropTypes.string,
      updated_at: PropTypes.string,
      created_at: PropTypes.string,
      timestamp: PropTypes.string,
      tags: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.string,
      ]),
    }),
  ),
};

GovernmentNotesPanel.defaultProps = {
  notes: [],
};

export default GovernmentNotesPanel;
