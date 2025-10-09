import { GovernmentLayout } from "../../components/government/GovernmentLayout";
import { LiveMonitoringPanel } from "../../components/government/LiveMonitoringPanel";
import { HistoricalTrendsPanel } from "../../components/government/HistoricalTrendsPanel";
import { PollutantIntelligencePanel } from "../../components/government/PollutantIntelligencePanel";
import { HeatmapPanel } from "../../components/government/HeatmapPanel";
import { ReportingPanel } from "../../components/government/ReportingPanel";
import { IncidentDeskPanel } from "../../components/government/IncidentDeskPanel";

export const GovernmentPortalPage = () => (
  <GovernmentLayout
    title="Government Analytics Command Center"
    description="A dedicated workspace for environmental agencies to monitor national air quality intelligence, deploy policy interventions, and collaborate across departments."
  >
    <LiveMonitoringPanel />
    <HistoricalTrendsPanel />
    <PollutantIntelligencePanel />
    <HeatmapPanel />
    <ReportingPanel />
    <IncidentDeskPanel />
  </GovernmentLayout>
);
