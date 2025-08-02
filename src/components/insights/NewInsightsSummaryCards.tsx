import React from 'react';
import TotalIncidentsCard from './cards/TotalIncidentsCard';
import FacilityRiskCard from './cards/FacilityRiskCard';
import ReportTypeCard from './cards/ReportTypeCard';
import TopIncidentCreatorCard from './cards/TopIncidentCreatorCard';
import { MonthlyTrends, FacilityRisk, ReportTypeDistribution, AssignmentWorkload, TotalIncidentData, TopIncidentCreator } from '@/hooks/useNewInsightsData';

interface NewInsightsSummaryCardsProps {
  totalIncidentData: TotalIncidentData;
  facilityRisk: FacilityRisk;
  reportTypeDistribution: ReportTypeDistribution;
  topIncidentCreator: TopIncidentCreator;
  onFilterApply: (filterType: string, value: string) => void;
}

const NewInsightsSummaryCards: React.FC<NewInsightsSummaryCardsProps> = ({
  totalIncidentData,
  facilityRisk,
  reportTypeDistribution,
  topIncidentCreator,
  onFilterApply
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <TotalIncidentsCard data={totalIncidentData} onFilterApply={onFilterApply} />
      <FacilityRiskCard risk={facilityRisk} onFilterApply={onFilterApply} />
      <ReportTypeCard distribution={reportTypeDistribution} onFilterApply={onFilterApply} />
      <TopIncidentCreatorCard creator={topIncidentCreator} onFilterApply={onFilterApply} />
    </div>
  );
};

export default NewInsightsSummaryCards;