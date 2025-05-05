
import { IncidentCategory } from '@/contexts/IncidentContext';
import { DateRange } from 'react-day-picker';

export interface BenchmarkingState {
  selectedCategory: IncidentCategory | '';
  selectedCities: string[];
  showSubcategories: boolean;
  dateRange: DateRange | undefined;
}

export interface BenchmarkingChartData {
  name: string;
  [key: string]: string | number; // For city and school data
}
