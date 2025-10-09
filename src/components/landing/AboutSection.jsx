import { SectionHeading } from '../common/SectionHeading';

const pillars = [
  {
    title: 'Citizen-first experience',
    description:
      'Empower communities with accessible AQI tracking, health advisories, and personalized city watchlists.'
  },
  {
    title: 'Agency-grade intelligence',
    description:
      'Provide government agencies with role-based dashboards, incident management, and policy impact analytics.'
  },
  {
    title: 'Global environmental network',
    description:
      'Monitor 200+ cities with unified pollutant data, real-time alerts, and collaborative response workflows.'
  },
];

export const AboutSection = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-4">
      <div className="space-y-16">
        <SectionHeading
          eyebrow="MISSION"
          title="Harness data to defend the air we breathe"
          description="Air Quality Tracker bridges grassroots awareness with national-scale decision making to drive faster environmental response and accountability."
        />

        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="glass-panel p-8">
              <h3 className="text-xl font-semibold text-slate-900">{pillar.title}</h3>
              <p className="mt-3 text-slate-600 leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
