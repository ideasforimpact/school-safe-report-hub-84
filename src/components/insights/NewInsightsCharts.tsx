import React from 'react';
import { 
  MonthlyTrends, 
  FacilityRisk, 
  ReportTypeDistribution, 
  AssignmentWorkload,
  PriorityDistribution,
  CategoryBreakdown,
  StatusOverview,
  TopContributors,
  MonthlyTrendsArea
} from '@/hooks/useNewInsightsData';
import MonthlyComparisonChart from './charts/MonthlyComparisonChart';
import BarChartComponent from './charts/BarChartComponent';
import SimplePieChart from './charts/SimplePieChart';
import StackedBarChart from './charts/StackedBarChart';
import PriorityPieChart from './charts/PriorityPieChart';
import MonthlyTrendsAreaChart from './charts/MonthlyTrendsAreaChart';
import CategoryHorizontalChart from './charts/CategoryHorizontalChart';
import StatusOverviewCards from './charts/StatusOverviewCards';
import TopContributorsList from './charts/TopContributorsList';
import { 
  transformFacilityRiskForChart,
  transformReportTypeForChart,
  transformAssignmentWorkloadForChart
} from '@/utils/chartDataTransformers';
import { CHART_COLORS } from '@/utils/chartColorUtils';

interface NewInsightsChartsProps {
  monthlyTrends: MonthlyTrends;
  facilityRisk: FacilityRisk;
  reportTypeDistribution: ReportTypeDistribution;
  assignmentWorkload: AssignmentWorkload;
  priorityDistribution: PriorityDistribution;
  categoryBreakdown: CategoryBreakdown;
  statusOverview: StatusOverview;
  topContributors: TopContributors;
  monthlyTrendsArea: MonthlyTrendsArea;
}

const NewInsightsCharts: React.FC<NewInsightsChartsProps> = ({
  monthlyTrends,
  facilityRisk,
  reportTypeDistribution,
  assignmentWorkload,
  priorityDistribution,
  categoryBreakdown,
  statusOverview,
  topContributors,
  monthlyTrendsArea
}) => {
  const facilityRiskData = transformFacilityRiskForChart(facilityRisk);
  const reportTypeData = transformReportTypeForChart(reportTypeDistribution);
  const assignmentWorkloadData = transformAssignmentWorkloadForChart(assignmentWorkload);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Monthly Trends Area Chart */}
      <div className="lg:col-span-2 h-[400px]">
        <MonthlyTrendsAreaChart 
          title="Monthly Incident Trends"
          description="6-month trend showing total, open, and closed incidents"
          data={monthlyTrendsArea}
        />
      </div>

      {/* Priority Distribution Chart */}
      <div className="h-[400px]">
        <PriorityPieChart
          title="Incidents by Priority"
          description="Distribution of incidents by priority level"
          data={priorityDistribution}
        />
      </div>

      {/* Category Distribution Chart */}
      <div className="h-[400px]">
        <CategoryHorizontalChart
          title="Incidents by Category"
          description="Breakdown of incidents by category"
          data={categoryBreakdown}
        />
      </div>

      {/* High-Risk Facilities Chart */}
      <div className="h-[400px]">
        <BarChartComponent
          title="High-Risk Facilities"
          description="Top facilities by incident count"
          data={facilityRiskData}
          color={CHART_COLORS.red}
          layout="horizontal"
        />
      </div>

      {/* Status Overview Cards */}
      <div className="h-[400px]">
        <StatusOverviewCards
          title="Status Overview"
          description="Current status distribution"
          data={statusOverview}
        />
      </div>

      {/* Top Contributors */}
      <div className="lg:col-span-2 h-[400px]">
        <TopContributorsList
          title="Top Contributors"
          description="Most active reporters and assignees"
          data={topContributors}
        />
      </div>

      {/* Assignment Workload Chart */}
      <div className="h-[400px]">
        <StackedBarChart
          title="Assignment Workload"
          description="Self-assigned vs assigned by others"
          data={assignmentWorkloadData}
        />
      </div>
    </div>
  );
};

export default NewInsightsCharts;