
import { Incident } from '@/types/incident';

// Define the filter state
export interface FilterState {
  search: string;
  type: string;
  category: string;
  subcategory: string;
  status: string;
  priority: string;
  location: string;
  facility: string;
  owner: string;
  reportedBy: string;
  startDate: Date | null;
  endDate: Date | null;
  showAdvancedFilters: boolean;
  showClosedIncidents: boolean;
  
  // Adding the missing properties
  isVoided: boolean;
  wasReopened: boolean;
  hasAttachments: boolean;
  involvedRole: string;
  dateFrom: string;
  dateTo: string;
}

// Define the return type for the filter hook
export interface FilterHookReturn {
  filters: FilterState;
  filteredIncidents: Incident[];
  availableCategories: string[];
  availableSubcategories: string[];
  availableLocations: string[];
  availableFacilities: string[];
  availableOwners: { id: string; name: string; }[];
  priorityOptions?: string[];
  statusOptions?: string[];
  locationOptions?: string[];
  handleFilterChange: (field: string, value: any) => void;
  toggleAdvancedFilters: () => void;
  clearFilters: () => void;
}
