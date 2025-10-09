import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardTabs } from '../../components/dashboard/DashboardTabs';
import { MapViewPanel } from '../../components/dashboard/MapViewPanel';
import { TrackingPanel } from '../../components/dashboard/TrackingPanel';
import { InsightsPanel } from '../../components/dashboard/InsightsPanel';
import { CityDetailModal } from '../../components/dashboard/CityDetailModal';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useDashboardData } from '../../hooks/useDashboardData';

const DASHBOARD_TABS = [
  { id: 'map', label: 'Map View' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'insights', label: 'Insights' },
];

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = usePersistentState('aq-dashboard-tab', 'map');
  const { trackedCities, availableCities, mapCities, insights, isLoading, actions } = useDashboardData();
  const { addCity, removeCity, reorderCity } = actions;
  const [selectedCityId, setSelectedCityId] = useState(null);

  const activePanel = useMemo(() => {
    switch (activeTab) {
      case 'tracking':
        return (
          <TrackingPanel
            trackedCities={trackedCities}
            availableCities={availableCities}
            onAdd={addCity}
            onRemove={removeCity}
            onReorder={reorderCity}
            isLoading={isLoading}
            onSelect={setSelectedCityId}
          />
        );
      case 'insights':
        return (
          <InsightsPanel
            summary={insights.summary}
            trendData={insights.trends}
            pollutantLeaders={insights.pollutantLeaders}
            isLoading={isLoading}
          />
        );
      default:
        return <MapViewPanel cities={mapCities} isLoading={isLoading} />;
    }
  }, [activeTab, addCity, availableCities, insights, isLoading, mapCities, removeCity, reorderCity, trackedCities]);

  const selectedCity = useMemo(
    () => (isLoading ? null : trackedCities.find((city) => city.id === selectedCityId) ?? null),
    [isLoading, selectedCityId, trackedCities],
  );

  const closeModal = () => setSelectedCityId(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-user-muted via-white to-gov-muted py-16">
      <div className="container mx-auto px-4 space-y-10">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-panel p-8 sm:p-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-user-primary font-semibold">Citizen Command Center</p>
              <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-slate-900">
                Track environmental health in real-time
              </h1>
              <p className="mt-3 text-slate-600 max-w-2xl">
                Monitor 200+ cities, manage personal watchlists, and get proactive insights to protect your community from air quality risks.
              </p>
            </div>
            <DashboardTabs tabs={DASHBOARD_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </motion.section>

        <motion.section
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-6"
        >
          {activePanel}
        </motion.section>
      </div>
      <CityDetailModal city={selectedCity} onClose={closeModal} />
    </div>
  );
};
