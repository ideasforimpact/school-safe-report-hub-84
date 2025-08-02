import React from 'react';
import { MonthlyTrends, FacilityRisk, ReportTypeDistribution, AssignmentWorkload } from '@/hooks/useNewInsightsData';
import MonthlyComparisonChart from './charts/MonthlyComparisonChart';
import BarChartComponent from './charts/BarChartComponent';
import SimplePieChart from './charts/SimplePieChart';
import StackedBarChart from './charts/StackedBarChart';
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
}

const NewInsightsCharts: React.FC<NewInsightsChartsProps> = ({
  monthlyTrends,
  facilityRisk,
  reportTypeDistribution,
  assignmentWorkload
}) => {
  const facilityRiskData = transformFacilityRiskForChart(facilityRisk);
  const reportTypeData = transformReportTypeForChart(reportTypeDistribution);
  const assignmentWorkloadData = transformAssignmentWorkloadForChart(assignmentWorkload);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Comparison Chart */}
      <div className="h-[500px]">
        <MonthlyComparisonChart 
          monthlyTrends={monthlyTrends}
          title="Monthly Comparison Analysis"
          description="Compare incident counts between selected months"
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

      {/* Report Type Distribution Chart */}
      <div className="h-[400px]">
        <SimplePieChart
          title="Report Type Distribution"
          description="Breakdown of incident types"
          data={reportTypeData}
          colors={[CHART_COLORS.red, CHART_COLORS.orange, CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.purple, CHART_COLORS.yellow]}
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