import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { GovernmentLayout } from '../../components/government/GovernmentLayout';
import { LiveMonitoringPanel } from '../../components/government/LiveMonitoringPanel';
import { HistoricalTrendsPanel } from '../../components/government/HistoricalTrendsPanel';
import { PollutantIntelligencePanel } from '../../components/government/PollutantIntelligencePanel';
import { HeatmapPanel } from '../../components/government/HeatmapPanel';
import { HotspotDetectionPanel } from '../../components/government/HotspotDetectionPanel';
import { ReportingPanel } from '../../components/government/ReportingPanel';
import { IncidentDeskPanel } from '../../components/government/IncidentDeskPanel';
import { GovernmentNotesPanel } from '../../components/government/GovernmentNotesPanel';
import { SystemStatusBanner } from '../../components/government/SystemStatusBanner';
import { ReportScheduleModal } from '../../components/government/ReportScheduleModal';
import { GovernmentAccountSummary } from '../../components/government/GovernmentAccountSummary';
import { GovernmentProfileModal } from '../../components/government/GovernmentProfileModal';
import { CITY_CATALOG } from '../../data/cityCatalog';
import useGovernmentDashboardData from '../../hooks/useGovernmentDashboardData';
import { useAuth } from '../../context/AuthContext';
import { signOut, updateGovernmentEmail, updateGovernmentProfile } from '../../services/authService';
import { isGovernmentEmailAllowed } from '../../utils/validation';

const availableCities = CITY_CATALOG.map((city) => ({
  id: city.id,
  name: `${city.name}, ${city.country}`,
}));

export const GovernmentPortalPage = () => {
  const {
    filters,
    liveMetrics,
    isLoading,
    lastUpdated,
    historicalSeries,
    historicalHighlights,
    selectedWindow,
    selectedCity,
    selectWindow,
    selectCity,
    policyInsights,
    pollutantBreakdown,
    intelligenceCards,
    heatmapPoints,
    incidents,
    incidentActivity,
    incidentActivityByIncident,
    hotspotAlerts,
    createIncident,
    updateIncident,
    removeIncident,
    reportFormat,
    setReportFormat,
    scheduledReports,
    reportDispatchLog,
  systemAlerts,
  mapboxGuardrail,
    exportReport,
    setFilters,
    refresh,
    notes,
    measurementUploads,
    submitMeasurementUpload,
    isRecordingUpload,
    uploadError,
    lastUploadSummary,
    scheduleReport,
    isSchedulingReport,
    scheduleReportError,
    resetScheduleReportError,
  } = useGovernmentDashboardData();

  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
  const { user, profile, refreshProfile } = useAuth();
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await signOut();
      if (error) {
        throw new Error(error);
      }
    },
    onSettled: () => {
      refreshProfile();
    },
  });

  const profileMutation = useMutation({
    mutationFn: async ({ fullName, department, jurisdiction, governmentRole }) => {
      if (!user?.id) {
        throw new Error('Missing user context for profile update.');
      }

      return updateGovernmentProfile({
        userId: user.id,
        fullName,
        department,
        jurisdiction,
        governmentRole,
      });
    },
  });

  const emailMutation = useMutation({
    mutationFn: async ({ email }) => updateGovernmentEmail({ email }),
  });

  const handleConfigureSchedule = useCallback(() => {
    resetScheduleReportError();
    setScheduleModalOpen(true);
  }, [resetScheduleReportError]);

  const handleCloseScheduleModal = useCallback(() => {
    setScheduleModalOpen(false);
    resetScheduleReportError();
  }, [resetScheduleReportError]);

  const handleScheduleSubmit = useCallback(async (values) => {
    try {
      await scheduleReport(values);
      setScheduleModalOpen(false);
    } catch (error) {
      // errors are surfaced via scheduleReportError from the hook
    }
  }, [scheduleReport]);

  const attributionNotes = useMemo(
    () => intelligenceCards
      .filter((card) => card.title !== 'Current Hotspot')
      .map((card) => ({
        id: card.title,
        title: card.title,
        description: card.meta,
      })),
    [intelligenceCards],
  );

  const profileDefaults = useMemo(() => ({
    fullName: profile?.full_name ?? '',
    department: profile?.department ?? '',
    jurisdiction: profile?.jurisdiction ?? '',
    governmentRole: profile?.government_role ?? '',
    email: user?.email ?? '',
  }), [profile?.department, profile?.full_name, profile?.government_role, profile?.jurisdiction, user?.email]);

  const handleSignOut = useCallback(async () => {
    setProfileError(null);
    try {
      await signOutMutation.mutateAsync();
    } catch (error) {
      setProfileError(error.message ?? 'Failed to sign out. Please try again.');
    }
  }, [signOutMutation]);

  const handleProfileSave = useCallback(async (values) => {
    setProfileError(null);

    const nextEmail = values.email?.trim() ?? '';
    const currentEmail = user?.email ?? '';

    if (nextEmail && nextEmail !== currentEmail && !isGovernmentEmailAllowed(nextEmail)) {
      setProfileError('Government accounts require verified .gov domains.');
      return;
    }

    try {
      await profileMutation.mutateAsync({
        fullName: values.fullName,
        department: values.department,
        jurisdiction: values.jurisdiction,
        governmentRole: values.governmentRole,
      });

      if (nextEmail && nextEmail !== currentEmail) {
        await emailMutation.mutateAsync({ email: nextEmail });
      }

      await refreshProfile();
      setProfileModalOpen(false);
    } catch (error) {
      setProfileError(error.message ?? 'Failed to update account.');
    }
  }, [profileMutation, emailMutation, refreshProfile, user?.email]);
  return (
    <>
      <GovernmentLayout
        title="Government Analytics Command Center"
        description="A dedicated workspace for environmental agencies to monitor national air quality intelligence, deploy policy interventions, and collaborate across departments."
        headerActions={(
          <GovernmentAccountSummary
            profile={profile}
            email={user?.email ?? '—'}
            onEditProfile={() => {
              setProfileError(null);
              setProfileModalOpen(true);
            }}
            onSignOut={handleSignOut}
            isSigningOut={signOutMutation.isPending}
          />
        )}
      >
        <SystemStatusBanner alerts={systemAlerts} guardrail={mapboxGuardrail} />

        <LiveMonitoringPanel
          rows={liveMetrics}
          filters={filters}
          onFilterChange={setFilters}
          onRefresh={refresh}
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          onExport={({ format, rows }) => exportReport({ format, rows })}
        />

        <HistoricalTrendsPanel
          series={historicalSeries}
          highlights={historicalHighlights}
          selectedWindow={selectedWindow}
          onWindowChange={selectWindow}
          selectedCity={selectedCity}
          onCityChange={selectCity}
          availableCities={availableCities}
          policyInsights={policyInsights}
        />

        <PollutantIntelligencePanel
          intelligenceCards={intelligenceCards}
          dominanceMatrix={pollutantBreakdown.table ?? []}
          attributionNotes={attributionNotes}
        />

        <HeatmapPanel points={heatmapPoints} />

        <HotspotDetectionPanel hotspots={hotspotAlerts} />

        <GovernmentNotesPanel notes={notes} />

        <ReportingPanel
          onDownload={(format) => exportReport({ format, rows: liveMetrics })}
          format={reportFormat}
          onFormatChange={setReportFormat}
          scheduledReports={scheduledReports}
          reportDispatchLog={reportDispatchLog}
          onConfigureSchedule={handleConfigureSchedule}
          scheduleError={scheduleReportError}
          measurementUploads={measurementUploads}
          onUploadMeasurements={(file) => submitMeasurementUpload({ file })}
          isUploading={isRecordingUpload}
          uploadError={uploadError}
          lastUploadSummary={lastUploadSummary}
        />

        {isScheduleModalOpen && (
          <ReportScheduleModal
            onClose={handleCloseScheduleModal}
            onSubmit={handleScheduleSubmit}
            isSubmitting={isSchedulingReport}
            error={scheduleReportError}
          />
        )}

        <IncidentDeskPanel
          incidents={incidents}
          incidentActivity={incidentActivity}
          incidentActivityByIncident={incidentActivityByIncident}
          onCreate={createIncident}
          onUpdate={updateIncident}
          onDelete={removeIncident}
        />
      </GovernmentLayout>

      <GovernmentProfileModal
        isOpen={isProfileModalOpen}
        initialValues={profileDefaults}
        onClose={() => {
          setProfileError(null);
          setProfileModalOpen(false);
        }}
        onSave={handleProfileSave}
        isSaving={profileMutation.isPending || emailMutation.isPending}
        errorMessage={profileError}
      />
    </>
  );
};

export default GovernmentPortalPage;
