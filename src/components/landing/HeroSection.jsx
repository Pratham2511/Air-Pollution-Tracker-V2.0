import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SectionHeading } from '../common/SectionHeading';
import { StatCard } from '../common/StatCard';

const stats = [
  {
    title: 'Cities Monitored',
    value: '200+',
    change: '80 Indian • 120 Global',
    trend: 'neutral',
    badge: 'moderate',
    description: 'Real-time air quality coverage across critical urban clusters and cross-border corridors.'
  },
  {
    title: 'AQI Updates',
    value: '45 sec',
    change: 'Average refresh interval',
    trend: 'up',
    badge: 'good',
    description: 'Live streams from OpenAQ aggregated with Supabase caching for visual intelligence.'
  },
  {
    title: 'Government Actions',
    value: '128',
    change: 'Incident reports resolved in last 30 days',
    trend: 'up',
    badge: 'unhealthy',
    description: 'Inter-department collaboration powered by policy simulators and incident management workflows.'
  },
];

export const HeroSection = () => (
  <section className="relative overflow-hidden backdrop-mesh">
    <div className="absolute inset-0 hero-gradient" />
    <div className="absolute -top-20 -right-32 hidden lg:block">
      <div className="w-[28rem] h-[28rem] bg-user-accent/20 rounded-full blur-3xl" />
    </div>
    <div className="absolute -bottom-20 -left-32 hidden lg:block">
      <div className="w-[26rem] h-[26rem] bg-gov-accent/20 rounded-full blur-3xl" />
    </div>

    <div className="relative container mx-auto px-4 py-20 lg:py-28">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="AIR QUALITY INTELLIGENCE"
            title="Realtime air health intelligence for citizens and city leaders"
            description="Track, analyze, and respond to environmental risks with a unified platform bridging everyday citizens and strategic agencies."
            alignment="left"
          />
          <div className="flex flex-wrap gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-3 rounded-full bg-user-primary text-white px-6 py-3 text-lg font-medium shadow-ambient hover:shadow-lg transition-all"
            >
              Citizen Dashboard
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-sm">→</span>
            </Link>
            <Link
              to="/gov"
              className="inline-flex items-center gap-3 rounded-full border border-gov-primary text-gov-primary px-6 py-3 text-lg font-medium hover:bg-gov-primary hover:text-white transition-all"
            >
              Government Command Center
            </Link>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-800 text-sm">
              🔬 <strong>Demo Mode Active:</strong> Both dashboards are accessible without authentication. 
              Click the buttons above to explore the Citizen Dashboard and Government Portal with sample data.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                trend={stat.trend}
                badge={stat.badge}
              >
                {stat.description}
              </StatCard>
            ))}
          </div>
        </div>
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-panel p-6 sm:p-10"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Intelligent AQI Insights</h3>
                <p className="text-sm text-slate-500 mt-1">Powered by OpenAQ & Supabase Analytics</p>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-user-primary/15 text-user-primary text-xl font-semibold animate-pulse">
                AI
              </span>
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-user-primary/10 text-user-primary flex items-center justify-center font-semibold">
                  01
                </span>
                <div>
                  <p className="font-semibold text-slate-800">Realtime AQI Lattice</p>
                  <p>Dynamic mapping across 200+ cities with health alerts and pollutant breakdowns.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-gov-primary/10 text-gov-primary flex items-center justify-center font-semibold">
                  02
                </span>
                <div>
                  <p className="font-semibold text-slate-800">Government-grade Intelligence</p>
                  <p>Role-based dashboards for policymaking, incident response, and regulatory compliance.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-aqi-unhealthy/10 text-aqi-unhealthy flex items-center justify-center font-semibold">
                  03
                </span>
                <div>
                  <p className="font-semibold text-slate-800">Predictive Signals</p>
                  <p>Forecast spikes before they happen with trend analysis and correlated weather data.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -bottom-10 -left-6 hidden xl:block"
          >
            <div className="glass-panel p-6 w-56">
              <p className="text-sm text-slate-500">Live AQI</p>
              <p className="text-3xl font-semibold text-slate-900">128</p>
              <p className="text-xs text-slate-500 mt-2">New Delhi • PM2.5 dominant</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </section>
);
