
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import BenchmarkingHeader from '@/components/benchmarking/BenchmarkingHeader';
import BenchmarkingFilters from '@/components/benchmarking/BenchmarkingFilters';
import BenchmarkingContent from '@/components/benchmarking/BenchmarkingContent';
import AboutBenchmarkingData from '@/components/benchmarking/AboutBenchmarkingData';
import ViewToggle from '@/components/benchmarking/ViewToggle';
import { useBenchmarkingData } from '@/hooks/benchmarking';

const Benchmarking = () => {
  const {
    selectedCategory,
    setSelectedCategory,
    selectedCities,
    showSubcategories,
    setShowSubcategories,
    dateRange,
    setDateRange,
    categories,
    cityNames,
    toggleCity,
    chartData
  } = useBenchmarkingData();
  
  return (
    <Layout>
      <BenchmarkingHeader />
      
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Multi-City Benchmarking</CardTitle>
              <CardDescription>
                Compare your school's data with multiple cities across the region
              </CardDescription>
            </div>
            <ViewToggle 
              showSubcategories={showSubcategories} 
              setShowSubcategories={setShowSubcategories} 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <BenchmarkingFilters 
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              cityNames={cityNames}
              selectedCities={selectedCities}
              toggleCity={toggleCity}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
            
            <BenchmarkingContent 
              selectedCategory={selectedCategory}
              showSubcategories={showSubcategories}
              chartData={chartData}
              selectedCities={selectedCities}
            />
          </div>
          
          <AboutBenchmarkingData />
        </CardContent>
      </Card>
    </Layout>
  );
};

export default Benchmarking;
