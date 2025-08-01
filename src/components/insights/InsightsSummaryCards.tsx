import React from 'react';
import MonthlyTrendCard from './cards/MonthlyTrendCard';
import FacilityRiskCard from './cards/FacilityRiskCard';
import ReportTypeCard from './cards/ReportTypeCard';
import AssignmentWorkloadCard from './cards/AssignmentWorkloadCard';
import { 
  calculateMonthlyTrends,
  calculateFacilityRisks,
  calculateReportTypeDistribution,
  calculateAssignmentWorkload
} from '@/utils/insights/businessMetrics';

interface InsightsSummaryCardsProps {
  filteredIncidents: any[];
  categoryData: Array<{name: string, value: number}>;
  statusData: Array<{name: string, value: number}>;
  facilityData: Array<{name: string, value: number}>;
  onFilterApply?: (filterType: string, value: string) => void;
}

const InsightsSummaryCards: React.FC<InsightsSummaryCardsProps> = ({
  filteredIncidents,
  categoryData,
  statusData,
  facilityData,
  onFilterApply
}) => {
  // Calculate business metrics from actual incident data
  const monthlyTrends = calculateMonthlyTrends(filteredIncidents);
  const facilityRisks = calculateFacilityRisks(filteredIncidents);
  const reportTypeMetrics = calculateReportTypeDistribution(filteredIncidents);
  const assignmentMetrics = calculateAssignmentWorkload(filteredIncidents);

  const handleFacilityClick = (facilityName: string) => {
    onFilterApply?.('facility', facilityName);
  };

  const handleTypeClick = (reportType: string) => {
    onFilterApply?.('type', reportType);
  };

  const handleEmployeeClick = (employeeName: string) => {
    onFilterApply?.('assignee', employeeName);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <MonthlyTrendCard metrics={monthlyTrends} />
      <FacilityRiskCard 
        metrics={facilityRisks} 
        onFacilityClick={handleFacilityClick} 
      />
      <ReportTypeCard 
        metrics={reportTypeMetrics} 
        onTypeClick={handleTypeClick} 
      />
      <AssignmentWorkloadCard 
        metrics={assignmentMetrics} 
        onEmployeeClick={handleEmployeeClick} 
      />
    </div>
  );
};

export default InsightsSummaryCards;