import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import InsightsFilters from '@/components/insights/InsightsFilters';
import OverviewTab from '@/components/insights/tabs/OverviewTab';
import PeopleTab from '@/components/insights/tabs/PeopleTab';
import LocationTab from '@/components/insights/tabs/LocationTab';
import RiskAnalysisTab from '@/components/insights/tabs/RiskAnalysisTab';
import { useInsightsData } from '@/hooks/useInsightsData';
import { downloadCSV, prepareIncidentsExport } from '@/utils/insightsUtils';
import { CHART_COLOR_ARRAY } from '@/utils/chartColorUtils';
const Insights = () => {
  const [activeTab, setActiveTab] = useState('overview');
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

  // Export data as CSV
  const exportToCSV = () => {
    const csvContent = prepareIncidentsExport(filteredIncidents);
    downloadCSV(csvContent, `incident-report-${new Date().toISOString().slice(0, 10)}.csv`);
  };
  return <Layout>
      <div className="space-y-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 w-full">
          <div>
            <h1 className="text-2xl font-bold text-left">Insights & Reports</h1>
            <p className="text-gray-600 mt-1">Analyze incident data and trends</p>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={exportToCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export as CSV
            </Button>
          </div>
        </div>

        {/* Filter section */}
        <InsightsFilters dateFilter={filters.dateFilter} setDateFilter={value => handleFilterChange('dateFilter', value)} typeFilter={filters.typeFilter} setTypeFilter={value => handleFilterChange('typeFilter', value)} categoryFilter={filters.categoryFilter} setCategoryFilter={value => handleFilterChange('categoryFilter', value)} subcategoryFilter={filters.subcategoryFilter} setSubcategoryFilter={value => handleFilterChange('subcategoryFilter', value)} facilityFilter={filters.facilityFilter} setFacilityFilter={value => handleFilterChange('facilityFilter', value)} personFilter={filters.personFilter} setPersonFilter={value => handleFilterChange('personFilter', value)} roleFilter={filters.roleFilter} setRoleFilter={value => handleFilterChange('roleFilter', value)} dateRange={filters.dateRange} handleDateRangeChange={handleDateRangeChange} availableSubcategories={availableSubcategories} peopleInvolved={peopleInvolved} facilities={facilities} isAdmin={isAdmin} />

        {/* Tabs for different chart categories */}
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="people">People & Roles</TabsTrigger>
              <TabsTrigger value="location">Location & Facilities</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="w-full">
              <OverviewTab categoryData={chartData.categoryData} typeData={chartData.typeData} statusData={chartData.statusData} timeSeriesData={chartData.timeSeriesData} colors={CHART_COLOR_ARRAY} />
            </TabsContent>
            
            <TabsContent value="people" className="w-full">
              <PeopleTab roleDistributionData={roleDistributionData} assigneeData={chartData.assigneeData} colors={CHART_COLOR_ARRAY} />
            </TabsContent>
            
            <TabsContent value="location" className="w-full">
              <LocationTab locationData={chartData.locationData} facilityData={chartData.facilityData} heatmapData={chartData.heatmapData} isAdmin={isAdmin} colors={CHART_COLOR_ARRAY} />
            </TabsContent>
            
            <TabsContent value="risk" className="w-full">
              <RiskAnalysisTab subcategoryData={chartData.subcategoryData} riskData={chartData.riskData} colors={CHART_COLOR_ARRAY} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>;
};
export default Insights;