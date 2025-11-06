import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardTabs } from '../../components/dashboard/DashboardTabs';
import { MapViewPanel } from '../../components/dashboard/MapViewPanel';
import { TrackingPanel } from '../../components/dashboard/TrackingPanel';
import { InsightsPanel } from '../../components/dashboard/InsightsPanel';
import { CityDetailModal } from '../../components/dashboard/CityDetailModal';
import { CitizenAccountMenu } from '../../components/dashboard/CitizenAccountMenu';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useToast } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/authService';

const DASHBOARD_TABS = [
  { id: 'map', label: 'Map View' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'insights', label: 'Insights' },
];

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = usePersistentState('aq-dashboard-tab', 'map');
  const { trackedCities, availableCities, mapCities, insights, isLoading, error, actions } = useDashboardData();
  const { addCity, removeCity, reorderCity } = actions;
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const trackedCityMap = useMemo(
    () => new Map(trackedCities.map((city) => [city.id, city])),
    [trackedCities],
  );
  const canOpenOverview = trackedCities.length >= 2;
  const availableCityMap = useMemo(
    () => new Map(availableCities.map((city) => [city.id, city])),
    [availableCities],
  );
  const toast = useToast();
  const shownErrorsRef = useRef(new Set());

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      const { error: signOutError } = await signOut();
      if (signOutError) {
        const normalized = signOutError?.toLowerCase?.() ?? signOutError;
        const isDemoNotice = typeof normalized === 'string'
          && (normalized.includes('credential') || normalized.includes('not configured'));
        toast.addToast({
          type: isDemoNotice ? 'info' : 'danger',
          title: isDemoNotice ? 'Demo mode active' : 'Unable to sign out',
          description: isDemoNotice
            ? 'Sign-out is simulated because Supabase credentials are not configured.'
            : signOutError,
          duration: 5200,
        });
      } else {
        toast.addToast({
          type: 'success',
          title: 'Signed out',
          description: 'Your secure session has ended.',
          duration: 3200,
        });
      }
    } catch (error) {
      toast.addToast({
        type: 'danger',
        title: 'Sign out failed',
        description: error.message ?? 'Please try again.',
      });
    } finally {
      try {
        await refreshProfile();
      } catch (refreshError) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[DashboardPage] refreshProfile after sign-out failed', refreshError);
        }
      }
      setIsSigningOut(false);
    }
  }, [refreshProfile, toast]);

  const handleAddCity = useCallback(
    (cityId) => {
      if (!cityId || trackedCityMap.has(cityId)) {
        return;
      }
      const city = availableCityMap.get(cityId);
      addCity(cityId);
      toast.addToast({
        type: 'success',
        title: city ? `${city.name} added to tracking` : 'City added',
        description: 'You’ll now receive updated insights and map highlights.',
      });
    },
    [addCity, availableCityMap, toast, trackedCityMap],
  );

  const handleRemoveCity = useCallback(
    (cityId) => {
      if (!trackedCityMap.has(cityId)) {
        return;
      }
      const city = trackedCityMap.get(cityId);
      removeCity(cityId);
      toast.addToast({
        type: 'info',
        title: city ? `${city.name} removed` : 'City removed',
        description: 'You can add it back anytime from the tracking panel.',
      });
    },
    [removeCity, toast, trackedCityMap],
  );

  useEffect(() => {
    if (error && !shownErrorsRef.current.has(error)) {
      toast.addToast({
        type: 'warning',
        title: 'Showing backup data',
        description: 'We are syncing with the cloud, so cached catalog values are displayed temporarily.',
        duration: 6500,
      });
      shownErrorsRef.current.add(error);
    }
  }, [error, toast]);

  const handleOpenAnalysis = useCallback(
    (cityId) => {
      if (!cityId) {
        return;
      }
      navigate(`/analysis/${cityId}`);
    },
    [navigate],
  );

  const handleOpenOverview = useCallback(() => {
    if (!canOpenOverview) {
      return;
    }
    navigate('/analysis/overview');
  }, [canOpenOverview, navigate]);

  const activePanel = useMemo(() => {
    switch (activeTab) {
      case 'tracking':
        return (
          <TrackingPanel
            trackedCities={trackedCities}
            availableCities={availableCities}
            onAdd={handleAddCity}
            onRemove={handleRemoveCity}
            onReorder={reorderCity}
            isLoading={isLoading}
            onSelect={setSelectedCityId}
            onOpenAnalysis={handleOpenAnalysis}
            onOpenOverview={handleOpenOverview}
            canOpenOverview={canOpenOverview}
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
        return (
          <MapViewPanel
            cities={mapCities}
            isLoading={isLoading}
            onSelectCity={(cityId) => setSelectedCityId(cityId)}
            onToggleTracking={handleAddCity}
          />
        );
    }
  }, [activeTab, availableCities, canOpenOverview, handleAddCity, handleOpenAnalysis, handleOpenOverview, handleRemoveCity, insights, isLoading, mapCities, reorderCity, trackedCities]);

  const selectedCity = useMemo(() => {
    if (isLoading || !selectedCityId) {
      return null;
    }
    const trackedMatch = trackedCities.find((city) => city.id === selectedCityId);
    if (trackedMatch) {
      return { ...trackedMatch, isTracked: true };
    }
    const mapMatch = mapCities.find((city) => city.id === selectedCityId);
    return mapMatch ? { ...mapMatch, isTracked: Boolean(mapMatch.isTracked) } : null;
  }, [isLoading, mapCities, selectedCityId, trackedCities]);

  const closeModal = useCallback(() => setSelectedCityId(null), []);

  const openAnalysisFromModal = useCallback(
    (cityId) => {
      if (!cityId) {
        return;
      }
      closeModal();
      handleOpenAnalysis(cityId);
    },
    [closeModal, handleOpenAnalysis],
  );

  const toggleTrackedFromModal = useCallback(() => {
    if (!selectedCity) {
      return;
    }
    if (selectedCity.isTracked) {
      handleRemoveCity(selectedCity.id);
    } else {
      handleAddCity(selectedCity.id);
    }
  }, [handleAddCity, handleRemoveCity, selectedCity]);

  const activePanelId = `dashboard-panel-${activeTab}`;
  const activeTabId = `dashboard-tab-${activeTab}`;

  return (
    <>
      <main
        id="main-content"
        tabIndex="-1"
        className="min-h-screen bg-gradient-to-br from-user-muted via-white to-gov-muted py-16"
      >
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
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
                <div className="w-full sm:w-auto">
                  <CitizenAccountMenu
                    profile={profile}
                    email={user?.email ?? '—'}
                    onSignOut={handleSignOut}
                    isSigningOut={isSigningOut}
                  />
                </div>
                <div className="w-full sm:flex-1">
                  <DashboardTabs tabs={DASHBOARD_TABS} activeTab={activeTab} onTabChange={setActiveTab} panelIdPrefix="dashboard-panel" />
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            key={activeTab}
            id={activePanelId}
            role="tabpanel"
            aria-labelledby={activeTabId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {activePanel}
          </motion.section>
        </div>
      </main>
          <CityDetailModal
            city={selectedCity}
            onClose={closeModal}
            onOpenAnalysis={openAnalysisFromModal}
            onToggleTracking={toggleTrackedFromModal}
          />
    </>
  );
};

export default DashboardPage;
