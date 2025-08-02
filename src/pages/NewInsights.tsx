import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useNewInsightsData } from '@/hooks/useNewInsightsData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { prepareIncidentsExcelExport, downloadExcel } from '@/utils/insightsUtils';
import NewInsightsSummaryCards from '@/components/insights/NewInsightsSummaryCards';
import NewInsightsCharts from '@/components/insights/NewInsightsCharts';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { DateRange } from 'react-day-picker';

const NewInsights = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  const {
    monthlyTrends,
    facilityRisk,
    reportTypeDistribution,
    assignmentWorkload,
    priorityDistribution,
    categoryBreakdown,
    statusOverview,
    topContributors,
    monthlyTrendsArea,
    totalIncidentData,
    filteredIncidents,
    isLoading,
    onFilterApply
  } = useNewInsightsData(dateRange);

  const handleExportReport = () => {
    if (!filteredIncidents || filteredIncidents.length === 0) {
      return;
    }

    const excelData = prepareIncidentsExcelExport(filteredIncidents);
    const dateRangeText = dateRange?.from && dateRange?.to 
      ? `${dateRange.from.toISOString().split('T')[0]}_to_${dateRange.to.toISOString().split('T')[0]}`
      : 'all_data';
    const filename = `incidents_export_${dateRangeText}.xlsx`;
    
    downloadExcel(excelData, filename);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/incidents')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Incidents
            </Button>
            <h1 className="text-2xl font-semibold">Business Insights</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-80">
              <DatePickerWithRange
                date={dateRange}
                onChange={setDateRange}
                className="w-full"
              />
            </div>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/incidents')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Incidents
            </Button>
            <h1 className="text-2xl font-semibold">Business Insights</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-80">
              <DatePickerWithRange
                date={dateRange}
                onChange={setDateRange}
                className="w-full"
              />
            </div>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <NewInsightsSummaryCards
          totalIncidentData={totalIncidentData}
          facilityRisk={facilityRisk}
          reportTypeDistribution={reportTypeDistribution}
          assignmentWorkload={assignmentWorkload}
          onFilterApply={onFilterApply}
        />

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-6">Visual Analytics</h2>
        <NewInsightsCharts
          facilityRisk={facilityRisk}
          priorityDistribution={priorityDistribution}
          categoryBreakdown={categoryBreakdown}
          statusOverview={statusOverview}
          topContributors={topContributors}
          monthlyTrendsArea={monthlyTrendsArea}
          onFilterApply={onFilterApply}
        />
        </div>
      </div>
    </Layout>
  );
};

export default NewInsights;