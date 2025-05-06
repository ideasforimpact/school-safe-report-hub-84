
import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InsightsFilters from '@/components/insights/InsightsFilters';
import ChartsTab from '@/components/insights/tabs/ChartsTab';
import DashboardTab from '@/components/insights/tabs/DashboardTab';
import { useInsightsData } from '@/hooks/useInsightsData';
import { downloadCSV, prepareIncidentsExport } from '@/utils/insightsUtils';
import { CHART_COLOR_ARRAY } from '@/utils/chartColorUtils';

const Insights = () => {
  const {
    facilities,
    isAdmin,
    activeTab,
    setActiveTab,
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

  return (
    <Layout>
      <div className="space-y-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 w-full">
          <div>
            <h1 className="text-2xl font-bold">Insights & Reports</h1>
            <p className="text-gray-600 mt-1">Analyze incident data and trends</p>
          </div>
          
          <div className="flex space-x-2">
            {activeTab === "charts" && (
              <Button onClick={exportToCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export as CSV
              </Button>
            )}
          </div>
        </div>

        {/* Filter section */}
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

        {/* Tabs content */}
        <Tabs defaultValue="charts" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="charts">Charts & Analytics</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="charts" className="w-full">
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
              colors={CHART_COLOR_ARRAY}
              roleDistributionData={roleDistributionData}
            />
          </TabsContent>
          
          <TabsContent value="dashboard" className="w-full">
            <DashboardTab
              timeSeriesData={chartData.timeSeriesData}
              riskData={chartData.riskData}
              heatmapData={chartData.heatmapData}
              recentIncidents={filteredIncidents.slice(0, 10)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Insights;
