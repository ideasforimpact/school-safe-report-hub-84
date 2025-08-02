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

// Transform monthly trends for line chart (mock 6 months of data)
export function transformMonthlyTrendsForChart(trends: MonthlyTrends) {
  // Create mock historical data for context
  const mockHistoricalData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    
    let count;
    if (i === 0) {
      count = trends.currentMonth.count;
    } else if (i === 1) {
      count = trends.previousMonth.count;
    } else {
      // Generate realistic mock data based on current/previous pattern
      const variation = Math.random() * 0.3 - 0.15; // ±15% variation
      const baseValue = (trends.currentMonth.count + trends.previousMonth.count) / 2;
      count = Math.max(0, Math.round(baseValue * (1 + variation)));
    }
    
    mockHistoricalData.push({
      month: monthLabel,
      count
    });
  }
  
  return mockHistoricalData;
}

// Transform facility risk for horizontal bar chart
export function transformFacilityRiskForChart(facilityRisk: FacilityRisk) {
  return facilityRisk.topFacilities.map(facility => ({
    name: facility.name,
    value: facility.count,
    percentage: facility.percentage
  }));
}

// Transform report type distribution for pie chart
export function transformReportTypeForChart(reportTypeDistribution: ReportTypeDistribution) {
  return reportTypeDistribution.types.map(type => ({
    name: type.name,
    value: type.count,
    percentage: type.percentage
  }));
}

// Transform assignment workload for stacked bar chart
export function transformAssignmentWorkloadForChart(assignmentWorkload: AssignmentWorkload) {
  return assignmentWorkload.topAssignees.map(assignee => ({
    name: assignee.name,
    selfAssigned: assignee.selfAssigned,
    assignedByOthers: assignee.assignedByOthers,
    total: assignee.totalAssigned,
    open: assignee.openCount
  }));
}

// Transform priority distribution for pie chart
export function transformPriorityDistributionForChart(priorityDistribution: PriorityDistribution) {
  return priorityDistribution.priorities.map(priority => ({
    name: priority.name,
    value: priority.count,
    percentage: priority.percentage,
    fill: priority.color
  }));
}

// Transform category breakdown for horizontal bar chart
export function transformCategoryBreakdownForChart(categoryBreakdown: CategoryBreakdown) {
  return categoryBreakdown.categories.map(category => ({
    name: category.name,
    value: category.count,
    percentage: category.percentage
  }));
}

// Transform status overview for cards
export function transformStatusOverviewForChart(statusOverview: StatusOverview) {
  return statusOverview.statuses.map(status => ({
    name: status.name,
    count: status.count,
    percentage: status.percentage
  }));
}

// Transform top contributors for list
export function transformTopContributorsForChart(topContributors: TopContributors) {
  return {
    reporters: topContributors.contributors.filter(c => c.type === 'reporter'),
    assignees: topContributors.contributors.filter(c => c.type === 'assignee'),
    totalReports: topContributors.totalReports
  };
}

// Transform monthly trends area for area chart
export function transformMonthlyTrendsAreaForChart(monthlyTrendsArea: MonthlyTrendsArea) {
  return monthlyTrendsArea.monthlyData.map(month => ({
    month: month.month,
    incidents: month.incidents,
    closed: month.closed,
    open: month.open
  }));
}