import PropTypes from 'prop-types';

export const PollutantIntelligencePanel = ({
  intelligenceCards,
  dominanceMatrix,
  attributionNotes,
}) => (
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
      {intelligenceCards.map((card) => (
        <article key={card.title} className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{card.title}</p>
          <p className="mt-4 text-3xl font-semibold text-gov-primary">{card.value}</p>
          <p className="mt-2 text-sm text-slate-600">{card.meta}</p>
          {card.chip && (
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-gov-primary" />
              {card.chip}
            </span>
          )}
        </article>
      ))}
    </div>

    <div className="mt-8 grid gap-6 lg:grid-cols-[1.75fr_1fr]">
      <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6">
        <h3 className="text-lg font-semibold text-slate-700">Dominance Matrix</h3>
        <div className="mt-4 space-y-3">
          {dominanceMatrix.map((row) => (
            <div key={row.pollutant} className="flex items-center gap-4">
              <span className="w-20 text-sm font-semibold text-slate-600">{row.pollutant}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gov-primary to-gov-accent"
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
          {(attributionNotes.length ? attributionNotes : [
            {
              id: 'placeholder',
              title: 'Awaiting linked intelligence',
              description: 'Upload attribution reports or connect satellite feeds to populate this briefing.',
            },
          ]).map((note) => (
            <li key={note.id ?? note.title} className="rounded-2xl bg-slate-100/70 p-4">
              <p className="font-semibold text-slate-700">{note.title}</p>
              <p className="mt-1 text-xs text-slate-500">{note.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

PollutantIntelligencePanel.propTypes = {
  intelligenceCards: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      meta: PropTypes.string,
      chip: PropTypes.string,
    }),
  ).isRequired,
  dominanceMatrix: PropTypes.arrayOf(
    PropTypes.shape({
      pollutant: PropTypes.string,
      share: PropTypes.number,
      classification: PropTypes.string,
    }),
  ).isRequired,
  attributionNotes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
    }),
  ),
};

PollutantIntelligencePanel.defaultProps = {
  attributionNotes: [],
};
