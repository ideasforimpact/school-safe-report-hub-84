import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useNewInsightsData } from '@/hooks/useNewInsightsData';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NewInsightsSummaryCards from '@/components/insights/NewInsightsSummaryCards';
import NewInsightsCharts from '@/components/insights/NewInsightsCharts';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { DateRange } from 'react-day-picker';
import { subMonths, startOfDay } from 'date-fns';

const NewInsights = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);
    return {
      from: startOfDay(sixMonthsAgo),
      to: today
    };
  });
  
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
    topIncidentCreator,
    filteredIncidents,
    isLoading,
    onFilterApply
  } = useNewInsightsData(dateRange);


  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/incidents')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">Incident Analytics</h1>
          </div>
          <div className="w-80">
            <DatePickerWithRange
              date={dateRange}
              onChange={setDateRange}
              className="w-full"
            />
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
              size="icon" 
              onClick={() => navigate('/incidents')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">Incident Analytics</h1>
          </div>
          <div className="w-80">
            <DatePickerWithRange
              date={dateRange}
              onChange={setDateRange}
              className="w-full"
            />
          </div>
        </div>

          <NewInsightsSummaryCards 
            totalIncidentData={totalIncidentData}
            facilityRisk={facilityRisk}
            reportTypeDistribution={reportTypeDistribution}
            topIncidentCreator={topIncidentCreator}
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