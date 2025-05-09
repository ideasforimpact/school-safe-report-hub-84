
import { useState } from 'react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { FilterState } from '@/hooks/useIncidentFilters';
import FilterHeader from './filters/FilterHeader';
import BasicFilters from './filters/BasicFilters';
import DateRangeFilter from './filters/DateRangeFilter';
import FilterActions from './filters/FilterActions';
import AdvancedFilters from './filters/AdvancedFilters';

interface IncidentFiltersProps {
  filters: FilterState;
  onFilterChange: (field: string, value: any) => void;
  onClearFilters: () => void;
  toggleAdvancedFilters?: () => void;
  availableCategories: string[];
  availableSubcategories: string[];
  availableLocations?: string[];
  availableFacilities?: string[];
  availableOwners?: {id: string, name: string}[];
}

const IncidentFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  availableCategories,
  availableSubcategories,
  availableLocations = [],
  availableFacilities = [],
  availableOwners = []
}: IncidentFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Count active advanced filters
  const activeAdvancedFilterCount = [
    filters.facility,
    filters.owner,
    filters.isVoided,
    filters.wasReopened,
    filters.hasAttachments,
    filters.involvedRole,
    filters.type // Moved type to advanced filters
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow px-0 py-6">
      <div className="space-y-4 px-6">
        <FilterHeader 
          isOpen={isOpen} 
          setIsOpen={setIsOpen}
          activeFilterCount={activeAdvancedFilterCount}
        />
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <BasicFilters 
              filters={filters}
              onFilterChange={onFilterChange}
              availableLocations={availableLocations}
              availableCategories={availableCategories}
              availableSubcategories={availableSubcategories}
            />
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <DateRangeFilter 
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
                onDateChange={onFilterChange}
              />
              
              <FilterActions onClearFilters={onClearFilters} />
            </div>
            
            <AdvancedFilters 
              filters={filters}
              onFilterChange={onFilterChange}
              availableFacilities={availableFacilities}
              availableOwners={availableOwners}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default IncidentFilters;
