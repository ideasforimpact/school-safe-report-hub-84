
import { useBenchmarkingFilters } from './useBenchmarkingFilters';
import { useChartDataProcessing } from './useChartDataProcessing';
import { cityData } from './mockCityData';

export const useBenchmarkingData = () => {
  // Get filter state and handlers
  const filters = useBenchmarkingFilters();
  
  // Process chart data based on filters
  const { chartData } = useChartDataProcessing({
    selectedCategory: filters.selectedCategory,
    selectedCities: filters.selectedCities,
    showSubcategories: filters.showSubcategories,
    dateRange: filters.dateRange
  });

  return {
    ...filters,
    chartData
  };
};

export { cityData };
export * from './types';
