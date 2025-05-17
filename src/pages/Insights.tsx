
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
    chartData
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Use appropriate props for InsightsHeader */}
        <InsightsHeader onExport={handleExport} />
        
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
            <OverviewTab data={chartData} incidents={filteredIncidents} />
          </TabsContent>
          
          <TabsContent value="charts">
            <ChartsTab data={chartData} incidents={filteredIncidents} />
          </TabsContent>
          
          <TabsContent value="people">
            <PeopleTab data={chartData} incidents={filteredIncidents} />
          </TabsContent>
          
          <TabsContent value="locations">
            <LocationTab data={chartData} incidents={filteredIncidents} />
          </TabsContent>
          
          <TabsContent value="risk">
            <RiskAnalysisTab data={chartData} incidents={filteredIncidents} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Insights;
