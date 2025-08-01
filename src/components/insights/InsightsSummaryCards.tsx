import React from 'react';
import ResolutionRateCard from './cards/ResolutionRateCard';
import ResponseTimeCard from './cards/ResponseTimeCard';
import WorkloadCard from './cards/WorkloadCard';
import RiskAlertsCard from './cards/RiskAlertsCard';
import { 
  calculateResolutionMetrics, 
  calculateResponseMetrics, 
  calculateWorkloadMetrics, 
  calculateRiskMetrics 
} from '@/utils/insights/advancedMetrics';

interface InsightsSummaryCardsProps {
  filteredIncidents: any[];
  categoryData: Array<{name: string, value: number}>;
  statusData: Array<{name: string, value: number}>;
  facilityData: Array<{name: string, value: number}>;
}

const InsightsSummaryCards: React.FC<InsightsSummaryCardsProps> = ({
  filteredIncidents,
  categoryData,
  statusData,
  facilityData
}) => {
  // Calculate advanced metrics from actual incident data
  const resolutionMetrics = calculateResolutionMetrics(filteredIncidents);
  const responseMetrics = calculateResponseMetrics(filteredIncidents);
  const workloadMetrics = calculateWorkloadMetrics(filteredIncidents);
  const riskMetrics = calculateRiskMetrics(filteredIncidents);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <ResolutionRateCard metrics={resolutionMetrics} />
      <ResponseTimeCard metrics={responseMetrics} />
      <WorkloadCard metrics={workloadMetrics} />
      <RiskAlertsCard metrics={riskMetrics} />
    </div>
  );
};

export default InsightsSummaryCards;