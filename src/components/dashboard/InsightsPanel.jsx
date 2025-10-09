import PropTypes from 'prop-types';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { StatCard } from '../common/StatCard';

export const InsightsPanel = ({ summary, trendData, pollutantLeaders, isLoading }) => (
  <div className="space-y-8">
    {isLoading ? (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="glass-panel h-full animate-pulse p-6 sm:p-8">
            <div className="h-4 w-24 rounded-full bg-slate-200" />
            <div className="mt-4 h-8 w-32 rounded-full bg-slate-200" />
            <div className="mt-6 h-20 rounded-2xl bg-slate-200" />
          </div>
        ))}
      </div>
    ) : (
      <div className="grid gap-4 md:grid-cols-3">
        {summary.map((stat) => (
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
    )}

    <div className="grid gap-6 xl:grid-cols-2">
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">City AQI Trend (7d)</h3>
        <p className="text-sm text-slate-500">Rolling averages for your tracked locations.</p>
        <div className="h-64">
          {isLoading ? (
            <div className="h-full w-full animate-pulse rounded-2xl bg-slate-200" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="colorAQI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34a853" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#34a853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ borderRadius: '1rem', borderColor: '#cbd5f5', boxShadow: '0 14px 30px -12px rgba(31, 79, 139, 0.25)' }}
                />
                <Area type="monotone" dataKey="aqi" stroke="#0f9d58" fillOpacity={1} fill="url(#colorAQI)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Top Pollutant Contributors</h3>
        <p className="text-sm text-slate-500">Dominant pollutant levels across tracked cities.</p>
        <div className="h-64">
          {isLoading ? (
            <div className="h-full w-full animate-pulse rounded-2xl bg-slate-200" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pollutantLeaders} margin={{ top: 10, right: 20, bottom: 0, left: -30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="city" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ borderRadius: '1rem', borderColor: '#cbd5f5', boxShadow: '0 14px 30px -12px rgba(31, 79, 139, 0.25)' }}
                />
                <Bar dataKey="value" fill="#1f4f8b" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  </div>
);

InsightsPanel.propTypes = {
  summary: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      change: PropTypes.string,
      trend: PropTypes.oneOf(['up', 'down', 'neutral']),
      badge: PropTypes.oneOf(['good', 'moderate', 'unhealthy', 'veryUnhealthy', 'hazardous']),
      description: PropTypes.string,
    }),
  ).isRequired,
  trendData: PropTypes.arrayOf(
    PropTypes.shape({
      day: PropTypes.string.isRequired,
      aqi: PropTypes.number.isRequired,
    }),
  ).isRequired,
  pollutantLeaders: PropTypes.arrayOf(
    PropTypes.shape({
      city: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    }),
  ).isRequired,
  isLoading: PropTypes.bool,
};

InsightsPanel.defaultProps = {
  isLoading: false,
};
