import React from 'react';
import FacilityRiskCard from './cards/FacilityRiskCard';
import ReportTypeCard from './cards/ReportTypeCard';
import AssignmentWorkloadCard from './cards/AssignmentWorkloadCard';
import { MonthlyTrends, FacilityRisk, ReportTypeDistribution, AssignmentWorkload } from '@/hooks/useNewInsightsData';

interface NewInsightsSummaryCardsProps {
  monthlyTrends: MonthlyTrends;
  facilityRisk: FacilityRisk;
  reportTypeDistribution: ReportTypeDistribution;
  assignmentWorkload: AssignmentWorkload;
  onFilterApply: (filterType: string, value: string) => void;
}

const NewInsightsSummaryCards: React.FC<NewInsightsSummaryCardsProps> = ({
  monthlyTrends,
  facilityRisk,
  reportTypeDistribution,
  assignmentWorkload,
  onFilterApply
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <FacilityRiskCard risk={facilityRisk} onFilterApply={onFilterApply} />
      <ReportTypeCard distribution={reportTypeDistribution} onFilterApply={onFilterApply} />
      <AssignmentWorkloadCard workload={assignmentWorkload} onFilterApply={onFilterApply} />
    </div>
  );
};

export default NewInsightsSummaryCards;