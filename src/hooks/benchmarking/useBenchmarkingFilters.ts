
import { useState } from 'react';
import { IncidentCategory } from '@/contexts/IncidentContext';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { cityData } from './mockCityData';
import { BenchmarkingState } from './types';

export const useBenchmarkingFilters = () => {
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | ''>('Physical Injury');
  const [selectedCities, setSelectedCities] = useState<string[]>(['Central City']);
  const [showSubcategories, setShowSubcategories] = useState(false);
  // Add date range state with default of last 30 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  // Available categories and city names
  const categories = Object.keys(cityData['Central City']);
  const cityNames = Object.keys(cityData);
  
  const toggleCity = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      // Remove if already selected
      setSelectedCities(selectedCities.filter(city => city !== cityName));
    } else {
      // Add if not selected
      setSelectedCities([...selectedCities, cityName]);
    }
  };

  return {
    selectedCategory,
    setSelectedCategory: (category: IncidentCategory | string) => setSelectedCategory(category as IncidentCategory),
    selectedCities,
    setSelectedCities,
    showSubcategories,
    setShowSubcategories,
    dateRange,
    setDateRange,
    categories,
    cityNames,
    toggleCity
  };
};
