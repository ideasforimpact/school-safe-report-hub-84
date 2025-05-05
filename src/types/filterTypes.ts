
import { Incident } from '@/types/incident';

export interface FilterState {
  type: string;
  category: string;
  subcategory: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  priority: string;
  location: string;
  facility: string;
  owner: string;
  isVoided: boolean;
  wasReopened: boolean;
  hasAttachments: boolean;
  involvedRole: string;
  showAdvancedFilters: boolean;
}

export interface FilterHookReturn {
  filters: FilterState;
  filteredIncidents: Incident[];
  availableCategories: string[];
  availableSubcategories: string[];
  availableLocations: string[];
  availableFacilities: string[];
  availableOwners: {id: string, name: string}[];
  handleFilterChange: (field: string, value: any) => void;
  toggleAdvancedFilters: () => void;
  clearFilters: () => void;
}
