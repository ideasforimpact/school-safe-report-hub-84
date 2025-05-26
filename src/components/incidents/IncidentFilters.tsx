
import { useState } from 'react';
import { Search, Calendar, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { FilterState } from '@/types/filterTypes';
import BasicFilters from './filters/BasicFilters';

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
  priorityOptions?: string[];
  locationOptions?: string[];
  statusOptions?: string[];
}

const IncidentFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  toggleAdvancedFilters,
  availableCategories,
  availableSubcategories,
  availableLocations = [],
  availableFacilities = [],
  availableOwners = [],
  priorityOptions = [],
  locationOptions = [],
  statusOptions = []
}: IncidentFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Count active basic filters only
  const activeFilterCount = [
    filters.search,
    filters.location,
    filters.status,
    filters.category,
    filters.subcategory,
    filters.priority,
    filters.dateFrom,
    filters.dateTo
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-lg">Filters</h2>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount} active
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4 mr-1" />
            {isOpen ? 'Hide Filters' : 'Show Filters'}
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <BasicFilters 
              filters={filters}
              onFilterChange={onFilterChange}
              availableCategories={availableCategories}
              availableSubcategories={availableSubcategories}
              availableLocations={locationOptions}
              statusOptions={statusOptions}
              priorityOptions={priorityOptions}
            />
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">From:</span>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                  className="w-auto"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">To:</span>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onFilterChange('dateTo', e.target.value)}
                  className="w-auto"
                />
              </div>
              
              <Button variant="outline" onClick={onClearFilters} className="ml-auto">
                Clear Filters
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default IncidentFilters;
