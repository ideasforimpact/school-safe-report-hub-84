
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
    dateRange,
    setDateRange,
    categories,
    selectedCategory,
    setSelectedCategory,
    subcategories,
    selectedSubcategory,
    setSelectedSubcategory,
    facilities,
    selectedFacility,
    setSelectedFacility,
    filteredIncidents,
    handleExportData,
    clearFilters
  } = useInsightsData();

  return (
    <Layout>
      <div className="space-y-6">
        <InsightsHeader onExport={handleExportData} />
        
        <InsightsFilters 
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          subcategories={subcategories}
          selectedSubcategory={selectedSubcategory}
          onSubcategoryChange={setSelectedSubcategory}
          facilities={facilities}
          selectedFacility={selectedFacility}
          onFacilityChange={setSelectedFacility}
          onClearFilters={clearFilters}
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
            <OverviewTab incidents={filteredIncidents} />
          </TabsContent>
          
          <TabsContent value="charts">
            <ChartsTab incidents={filteredIncidents} />
          </TabsContent>
          
          <TabsContent value="people">
            <PeopleTab incidents={filteredIncidents} />
          </TabsContent>
          
          <TabsContent value="locations">
            <LocationTab incidents={filteredIncidents} />
          </TabsContent>
          
          <TabsContent value="risk">
            <RiskAnalysisTab incidents={filteredIncidents} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Insights;
