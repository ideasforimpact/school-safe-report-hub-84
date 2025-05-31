
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useInsightsData } from '@/hooks/useInsightsData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import InsightsHeader from '@/components/insights/InsightsHeader';
import InsightsFilters from '@/components/insights/InsightsFilters';
import OverviewTab from '@/components/insights/tabs/OverviewTab';
import ChartsTab from '@/components/insights/tabs/ChartsTab';
import PeopleTab from '@/components/insights/tabs/PeopleTab';
import LocationTab from '@/components/insights/tabs/LocationTab';
import RiskAnalysisTab from '@/components/insights/tabs/RiskAnalysisTab';

const Insights = () => {
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
    roleDistributionData
  } = useInsightsData();

  // Function to handle export
  const handleExport = () => {
    // If there's a real export function in useInsightsData, use that instead
    console.log('Exporting data...');
  };
  
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

  // Generate a consistent set of colors for charts
  const chartColors = [
    '#4f46e5', '#06b6d4', '#059669', '#8b5cf6', '#ec4899', 
    '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#d946ef'
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* InsightsHeader with no export prop */}
        <InsightsHeader />
        
        {/* Update InsightsFilters with the new props structure */}
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
          isAdmin={isAdmin}
        />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
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
    </Layout>
  );
};

export default Insights;
