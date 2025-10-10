import { useMemo } from 'react';
import { GovernmentLayout } from '../../components/government/GovernmentLayout';
import { LiveMonitoringPanel } from '../../components/government/LiveMonitoringPanel';
import { HistoricalTrendsPanel } from '../../components/government/HistoricalTrendsPanel';
import { PollutantIntelligencePanel } from '../../components/government/PollutantIntelligencePanel';
import { HeatmapPanel } from '../../components/government/HeatmapPanel';
import { HotspotDetectionPanel } from '../../components/government/HotspotDetectionPanel';
import { ReportingPanel } from '../../components/government/ReportingPanel';
import { IncidentDeskPanel } from '../../components/government/IncidentDeskPanel';
import { GovernmentNotesPanel } from '../../components/government/GovernmentNotesPanel';
import { CITY_CATALOG } from '../../data/cityCatalog';
import useGovernmentDashboardData from '../../hooks/useGovernmentDashboardData';

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
    exportReport,
    setFilters,
    refresh,
    notes,
    measurementUploads,
    submitMeasurementUpload,
    isRecordingUpload,
    uploadError,
    lastUploadSummary,
  } = useGovernmentDashboardData();

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

  return (
    <GovernmentLayout
      title="Government Analytics Command Center"
      description="A dedicated workspace for environmental agencies to monitor national air quality intelligence, deploy policy interventions, and collaborate across departments."
    >
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
        measurementUploads={measurementUploads}
        onUploadMeasurements={(file) => submitMeasurementUpload({ file })}
        isUploading={isRecordingUpload}
        uploadError={uploadError}
        lastUploadSummary={lastUploadSummary}
      />

      <IncidentDeskPanel
        incidents={incidents}
        incidentActivity={incidentActivity}
        incidentActivityByIncident={incidentActivityByIncident}
        onCreate={createIncident}
        onUpdate={updateIncident}
        onDelete={removeIncident}
      />
    </GovernmentLayout>
  );
};

export default GovernmentPortalPage;
