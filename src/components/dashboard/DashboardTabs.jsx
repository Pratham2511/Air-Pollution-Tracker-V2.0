import PropTypes from 'prop-types';

export const DashboardTabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="rounded-full bg-white/70 backdrop-blur border border-white/60 shadow-sm p-1 flex flex-wrap gap-2">
    {tabs.map((tab) => {
      const isActive = tab.id === activeTab;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`px-5 py-2 rounded-full text-sm sm:text-base font-semibold transition-all ${
            isActive
              ? 'bg-slate-900 text-white shadow-ambient'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-pressed={isActive}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

DashboardTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
};
