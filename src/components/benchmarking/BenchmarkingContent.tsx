
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChartView from './views/ChartView';
import TableView from './views/TableView';

interface BenchmarkingContentProps {
  selectedCategory: string;
  showSubcategories: boolean;
  chartData: any[];
  selectedCities: string[];
}

const BenchmarkingContent = ({ 
  selectedCategory, 
  showSubcategories, 
  chartData, 
  selectedCities 
}: BenchmarkingContentProps) => {
  return (
    <div className="md:col-span-3">
      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="pt-4">
          <ChartView 
            selectedCategory={selectedCategory}
            showSubcategories={showSubcategories}
            chartData={chartData}
            selectedCities={selectedCities}
          />
        </TabsContent>
        
        <TabsContent value="table" className="pt-4">
          <TableView 
            chartData={chartData}
            showSubcategories={showSubcategories}
            selectedCities={selectedCities}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BenchmarkingContent;
