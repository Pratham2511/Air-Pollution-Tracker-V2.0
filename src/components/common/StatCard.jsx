import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const badgeColors = {
  good: 'bg-aqi-good/20 text-aqi-good',
  moderate: 'bg-aqi-moderate/20 text-amber-600',
  unhealthy: 'bg-aqi-unhealthy/20 text-aqi-unhealthy',
  veryUnhealthy: 'bg-aqi-very-unhealthy/20 text-aqi-very-unhealthy',
  hazardous: 'bg-aqi-hazardous/20 text-aqi-hazardous',
};

export const StatCard = ({
  title,
  value,
  change,
  trend = 'neutral',
  badge,
  children,
}) => (
  <motion.div
    whileHover={{ y: -6 }}
    className="glass-panel p-6 sm:p-8 h-full flex flex-col gap-4 motion-safe:fade-slide-up"
  >
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-widest text-slate-500">{title}</p>
        <p className="text-3xl sm:text-4xl font-semibold text-slate-900 mt-1">{value}</p>
      </div>
      {badge && (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badgeColors[badge]}`}>
          {badge.replace(/([A-Z])/g, ' $1').trim()}
        </span>
      )}
    </div>
    {change && (
      <div className="flex items-center gap-2 text-sm">
        <span
          className={
            trend === 'up'
              ? 'text-aqi-good'
              : trend === 'down'
                ? 'text-aqi-very-unhealthy'
                : 'text-slate-500'
          }
        >
          {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '■'}
        </span>
        <span className="font-medium text-slate-600">{change}</span>
      </div>
    )}
    {children && <div className="text-sm text-slate-600 leading-relaxed">{children}</div>}
  </motion.div>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  badge: PropTypes.oneOf(['good', 'moderate', 'unhealthy', 'veryUnhealthy', 'hazardous']),
  children: PropTypes.node,
};
