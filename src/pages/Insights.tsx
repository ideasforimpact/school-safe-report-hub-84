
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useInsightsData } from '@/hooks/useInsightsData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InsightsHeader from '@/components/insights/InsightsHeader';
import InsightsFilters from '@/components/insights/InsightsFilters';
import OverviewTab from '@/components/insights/tabs/OverviewTab';
import ChartsTab from '@/components/insights/tabs/ChartsTab';
import PeopleTab from '@/components/insights/tabs/PeopleTab';
import LocationTab from '@/components/insights/tabs/LocationTab';
import RiskAnalysisTab from '@/components/insights/tabs/RiskAnalysisTab';
import InsightsSummaryCards from '@/components/insights/InsightsSummaryCards';
import { Skeleton } from '@/components/ui/skeleton';

const Insights = () => {
  const navigate = useNavigate();
  const {
    facilities,
    isAdmin,
    filters,
    handleFilterChange,
    handleDateRangeChange,
    filteredIncidents,
    availableSubcategories,
    peopleInvolved,
    chartData,
    roleDistributionData,
    isLoading,
    categories,
    subcategories,
    reportTypes,
    locations
  } = useInsightsData();
  
  // Function to clear filters
  const clearFilters = () => {
    // Reset all filters to their default values
    handleFilterChange('dateFilter', 'all');
    handleFilterChange('typeFilter', 'all');
    handleFilterChange('categoryFilter', 'all');
    handleFilterChange('subcategoryFilter', 'all');
    handleFilterChange('facilityFilter', 'all');
    handleFilterChange('personFilter', 'all');
    handleFilterChange('roleFilter', 'all');
    handleDateRangeChange(undefined);
  };

  // Function to handle filter application from summary cards
  const onFilterApply = (filterType: string, value: string) => {
    // Map filter types to the correct filter names
    switch (filterType) {
      case 'facility':
        handleFilterChange('facilityFilter', value);
        break;
      case 'type':
        handleFilterChange('typeFilter', value);
        break;
      case 'assignee':
        handleFilterChange('personFilter', value);
        break;
      default:
        break;
    }
  };

  // Generate a consistent set of colors for charts
  const chartColors = [
    '#4f46e5', '#06b6d4', '#059669', '#8b5cf6', '#ec4899', 
    '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#d946ef'
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6 p-6 w-full">
          {/* Header skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-48" />
              </div>
            </div>
          </div>
          
          {/* Summary cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          
          {/* Filters skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        {/* Header Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="ghost" 
                className="flex items-center"
                onClick={() => navigate('/incidents')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Incidents
              </Button>
            </div>
            <InsightsHeader />
          </div>
        </div>

        {/* Summary Cards */}
        <InsightsSummaryCards
          filteredIncidents={filteredIncidents}
          categoryData={chartData.categoryData}
          statusData={chartData.statusData}
          facilityData={chartData.facilityData}
          onFilterApply={onFilterApply}
        />

        {/* Filters Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <InsightsFilters 
              dateFilter={filters.dateFilter}
              setDateFilter={(value) => handleFilterChange('dateFilter', value)}
              typeFilter={filters.typeFilter}
              setTypeFilter={(value) => handleFilterChange('typeFilter', value)}
              categoryFilter={filters.categoryFilter}
              setCategoryFilter={(value) => handleFilterChange('categoryFilter', value)}
              subcategoryFilter={filters.subcategoryFilter}
              setSubcategoryFilter={(value) => handleFilterChange('subcategoryFilter', value)}
              facilityFilter={filters.facilityFilter}
              setFacilityFilter={(value) => handleFilterChange('facilityFilter', value)}
              personFilter={filters.personFilter}
              setPersonFilter={(value) => handleFilterChange('personFilter', value)}
              roleFilter={filters.roleFilter}
              setRoleFilter={(value) => handleFilterChange('roleFilter', value)}
              dateRange={filters.dateRange}
              handleDateRangeChange={handleDateRangeChange}
              availableSubcategories={availableSubcategories}
              peopleInvolved={peopleInvolved}
              facilities={facilities}
              categories={categories}
              reportTypes={reportTypes}
              isAdmin={isAdmin}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="people">People</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
                <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <OverviewTab 
                  categoryData={chartData.categoryData}
                  typeData={chartData.typeData}
                  statusData={chartData.statusData} 
                  timeSeriesData={chartData.timeSeriesData}
                  colors={chartColors}
                  filteredIncidents={filteredIncidents}
                />
              </TabsContent>
              
              <TabsContent value="charts">
                <ChartsTab 
                  categoryData={chartData.categoryData}
                  typeData={chartData.typeData}
                  subcategoryData={chartData.subcategoryData}
                  timeSeriesData={chartData.timeSeriesData}
                  locationData={chartData.locationData}
                  facilityData={chartData.facilityData}
                  assigneeData={chartData.assigneeData}
                  statusData={chartData.statusData}
                  riskData={chartData.riskData}
                  isAdmin={isAdmin}
                  colors={chartColors}
                  roleDistributionData={roleDistributionData}
                  heatmapData={chartData.heatmapData}
                />
              </TabsContent>
              
              <TabsContent value="people">
                <PeopleTab 
                  roleDistributionData={roleDistributionData}
                  assigneeData={chartData.assigneeData}
                  colors={chartColors}
                />
              </TabsContent>
              
              <TabsContent value="locations">
                <LocationTab 
                  locationData={chartData.locationData}
                  facilityData={chartData.facilityData}
                  heatmapData={chartData.heatmapData}
                  isAdmin={isAdmin}
                  colors={chartColors}
                />
              </TabsContent>
              
              <TabsContent value="risk">
                <RiskAnalysisTab 
                  subcategoryData={chartData.subcategoryData}
                  riskData={chartData.riskData}
                  colors={chartColors} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Insights;
