
import { useMemo } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import { cityData } from './mockCityData';
import { BenchmarkingState, BenchmarkingChartData } from './types';

export const useChartDataProcessing = (benchmarkingState: BenchmarkingState) => {
  const { incidents } = useIncidents();
  const { selectedCategory, selectedCities, showSubcategories, dateRange } = benchmarkingState;

  const chartData = useMemo(() => {
    if (!selectedCategory) return [];
    
    // Filter incidents by date range if it exists
    const filteredIncidents = incidents.filter(incident => {
      if (!dateRange?.from) return true;
      
      const incidentDate = new Date(incident.date);
      if (dateRange.to) {
        return incidentDate >= dateRange.from && incidentDate <= dateRange.to;
      }
      return incidentDate >= dateRange.from;
    });

    if (showSubcategories) {
      return processSubcategoryData(
        selectedCategory, 
        selectedCities, 
        filteredIncidents
      );
    } else {
      return processCategoryData(
        selectedCategory, 
        selectedCities, 
        filteredIncidents
      );
    }
  }, [incidents, selectedCategory, selectedCities, showSubcategories, dateRange]);

  return { chartData };
};

// Helper function to process subcategory level data
const processSubcategoryData = (
  selectedCategory: string, 
  selectedCities: string[], 
  filteredIncidents: any[]
): BenchmarkingChartData[] => {
  // Show detailed subcategory breakdown
  const subcategories = selectedCategory ? 
    Object.keys(cityData['Central City'][selectedCategory as keyof typeof cityData['Central City']] || {}) : 
    [];
  
  return subcategories.map(subcategory => {
    const dataItem: BenchmarkingChartData = { name: subcategory };
    
    // Add school data - filtered by date range
    const schoolCount = filteredIncidents
      .filter(incident => incident.category === selectedCategory && incident.subcategory === subcategory)
      .length;
    dataItem['Your School'] = schoolCount;
    
    // Add each selected city's data
    selectedCities.forEach(city => {
      if (cityData[city as keyof typeof cityData]) {
        const cityCategory = cityData[city as keyof typeof cityData][selectedCategory as keyof typeof cityData['Central City']];
        if (cityCategory) {
          dataItem[city] = cityCategory[subcategory as keyof typeof cityCategory] || 0;
        } else {
          dataItem[city] = 0;
        }
      }
    });
    
    return dataItem;
  });
};

// Helper function to process category level data
const processCategoryData = (
  selectedCategory: string, 
  selectedCities: string[], 
  filteredIncidents: any[]
): BenchmarkingChartData[] => {
  // Show aggregate category-level data
  return selectedCities.map(city => {
    const cityData_local = cityData[city as keyof typeof cityData];
    const cityCategory = cityData_local ? cityData_local[selectedCategory as keyof typeof cityData_local] : undefined;
    
    const totalCityIncidents = cityCategory 
      ? Object.values(cityCategory).reduce((a: number, b: number) => a + b, 0) 
      : 0;
    
    // Count school incidents for this category - filtered by date range
    const schoolCategoryCount = filteredIncidents
      .filter(incident => incident.category === selectedCategory)
      .length;
    
    const chartItem: BenchmarkingChartData = {
      name: city,
      'City Average': totalCityIncidents,
      'Your School': schoolCategoryCount
    };
    
    return chartItem;
  });
};
