import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

export const DashboardTabs = ({ tabs, activeTab, onTabChange, panelIdPrefix }) => {
  const focusTabByIndex = (index) => {
    const clampedIndex = (index + tabs.length) % tabs.length;
    const nextTab = tabs[clampedIndex];
    if (!nextTab) return;
    onTabChange(nextTab.id);
    queueMicrotask(() => {
      document.getElementById(`dashboard-tab-${nextTab.id}`)?.focus();
    });
  };

  const handleKeyDown = (event, index) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusTabByIndex(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusTabByIndex(index - 1);
    }
  };

  return (
    <div
      className="flex flex-wrap gap-2 rounded-full border border-white/60 bg-white/70 p-1 shadow-sm backdrop-blur"
      role="tablist"
      aria-label="Dashboard sections"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        const tabId = `dashboard-tab-${tab.id}`;
        const panelId = `${panelIdPrefix}-${tab.id}`;
        return (
          <button
            key={tab.id}
            id={tabId}
            type="button"
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className="group relative overflow-hidden rounded-full px-5 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900/50 sm:text-base"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
          >
            {isActive && (
              <motion.span
                layoutId="dashboard-tab-active-indicator"
                className="absolute inset-0 rounded-full bg-slate-900"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span
              className={`relative z-10 ${
                isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-900'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

DashboardTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  panelIdPrefix: PropTypes.string,
};

DashboardTabs.defaultProps = {
  panelIdPrefix: 'tab-panel',
};
