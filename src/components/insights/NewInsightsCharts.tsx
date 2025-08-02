import React from 'react';
import { 
  MonthlyTrends, 
  FacilityRisk, 
  ReportTypeDistribution, 
  PriorityDistribution,
  CategoryBreakdown,
  StatusOverview,
  TopContributors,
  MonthlyTrendsArea
} from '@/hooks/useNewInsightsData';
import BarChartComponent from './charts/BarChartComponent';
import PriorityPieChart from './charts/PriorityPieChart';
import MonthlyTrendsAreaChart from './charts/MonthlyTrendsAreaChart';
import CategoryHorizontalChart from './charts/CategoryHorizontalChart';
import StatusOverviewCards from './charts/StatusOverviewCards';
import TopReportersCard from './charts/TopReportersCard';
import TopAssigneesCard from './charts/TopAssigneesCard';
import { 
  transformFacilityRiskForChart
} from '@/utils/chartDataTransformers';
import { CHART_COLORS } from '@/utils/chartColorUtils';

interface NewInsightsChartsProps {
  facilityRisk: FacilityRisk;
  priorityDistribution: PriorityDistribution;
  categoryBreakdown: CategoryBreakdown;
  statusOverview: StatusOverview;
  topContributors: TopContributors;
  monthlyTrendsArea: MonthlyTrendsArea;
  onFilterApply?: (filterType: string, value: string) => void;
}

const NewInsightsCharts: React.FC<NewInsightsChartsProps> = ({
  facilityRisk,
  priorityDistribution,
  categoryBreakdown,
  statusOverview,
  topContributors,
  monthlyTrendsArea,
  onFilterApply
}) => {
  const facilityRiskData = transformFacilityRiskForChart(facilityRisk);

  return (
    <div className="space-y-6">
      {/* Row 1: Monthly Trends Area Chart (2 cols) + Priority Pie Chart (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px]">
          <MonthlyTrendsAreaChart 
            title="Monthly Incident Trends"
            description="6-month trend showing total, open, and closed incidents"
            data={monthlyTrendsArea}
          />
        </div>

        <div className="h-[400px]">
          <PriorityPieChart
            title="Incidents by Priority"
            description="Distribution of incidents by priority level"
            data={priorityDistribution}
          />
        </div>
      </div>

      {/* Row 2: Category Chart (1 col) + High-Risk Facilities (1 col) - Equal space */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[400px]">
          <CategoryHorizontalChart
            title="Incidents by Category"
            description="Breakdown of incidents by category"
            data={categoryBreakdown}
          />
        </div>

        <div className="h-[400px]">
          <BarChartComponent
            title="High-Risk Facilities"
            description="Top facilities by incident count"
            data={facilityRiskData}
            color={CHART_COLORS.red}
            layout="horizontal"
          />
        </div>
      </div>

      {/* Row 3: Top Assignees (1 col) + Status Overview (1 col) + Top Reporters (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="h-[400px]">
          <TopAssigneesCard
            data={topContributors}
            onFilterApply={onFilterApply}
          />
        </div>

        <div className="h-[400px]">
          <StatusOverviewCards
            title="Status Overview"
            description="Current status distribution"
            data={statusOverview}
          />
        </div>

        <div className="h-[400px]">
          <TopReportersCard
            data={topContributors}
            onFilterApply={onFilterApply}
          />
        </div>
      </div>
    </div>
  );
};

export default NewInsightsCharts;