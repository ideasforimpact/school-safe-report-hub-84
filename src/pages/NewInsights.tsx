import React from 'react';
import Layout from '@/components/layout/Layout';
import { useNewInsightsData } from '@/hooks/useNewInsightsData';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NewInsightsSummaryCards from '@/components/insights/NewInsightsSummaryCards';
import NewInsightsCharts from '@/components/insights/NewInsightsCharts';

const NewInsights = () => {
  const navigate = useNavigate();
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
    isLoading,
    onFilterApply
  } = useNewInsightsData();

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
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

        <NewInsightsSummaryCards 
          monthlyTrends={monthlyTrends}
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