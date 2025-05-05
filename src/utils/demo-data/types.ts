
import { Person, UserRef } from '@/types/incident';

// Category definitions with their subcategories
export interface CategoryDefinition {
  category: string;
  subcategories: string[];
}

// Facility definitions categorized by location
export interface FacilityMapping {
  location: string;
  facilities: string[];
}
