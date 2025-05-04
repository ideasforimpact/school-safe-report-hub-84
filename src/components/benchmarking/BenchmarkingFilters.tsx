
import React from 'react';
import { IncidentCategory } from '@/contexts/IncidentContext';
import DateRangeFilter from './filters/DateRangeFilter';
import CategoryFilter from './filters/CategoryFilter';
import CityFilter from './filters/CityFilter';
import AnalysisTips from './filters/AnalysisTips';
import { DateRange } from 'react-day-picker';

interface BenchmarkingFiltersProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: IncidentCategory) => void;
  cityNames: string[];
  selectedCities: string[];
  toggleCity: (cityName: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
}

const BenchmarkingFilters = ({ 
  categories,
  selectedCategory,
  setSelectedCategory,
  cityNames,
  selectedCities,
  toggleCity,
  dateRange,
  setDateRange
}: BenchmarkingFiltersProps) => {
  return (
    <div className="space-y-4 md:col-span-1">
      <DateRangeFilter dateRange={dateRange} setDateRange={setDateRange} />
      
      <CategoryFilter 
        categories={categories} 
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory} 
      />
      
      <CityFilter 
        cityNames={cityNames} 
        selectedCities={selectedCities} 
        toggleCity={toggleCity} 
      />
      
      <AnalysisTips />
    </div>
  );
};

export default BenchmarkingFilters;
