
import { useState } from 'react';
import { Search, Calendar, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import BasicFilters from './filters/BasicFilters';

interface ServerFilters {
  search?: string;
  category?: string;
  subcategory?: string;
  status?: string;
  priority?: string;
  location?: string;
  facility?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface IncidentFiltersProps {
  filters: ServerFilters;
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
  const [isOpen, setIsOpen] = useState(true);

  // Count active filters
  const activeFilterCount = [
    filters.search,
    filters.location,
    filters.status,
    filters.category,
    filters.subcategory,
    filters.priority,
    filters.dateFrom,
    filters.dateTo
  ].filter(value => value && value.trim() !== '').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg text-gray-900">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Filter className="h-4 w-4" />
            <span className="text-sm">{isOpen ? 'Hide Filters' : 'Show Filters'}</span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="space-y-4">
            <BasicFilters 
              filters={filters}
              onFilterChange={onFilterChange}
              availableCategories={availableCategories}
              availableSubcategories={availableSubcategories}
              availableLocations={locationOptions}
              statusOptions={statusOptions}
              priorityOptions={priorityOptions}
            />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 pt-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-1">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">From Date</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                      className="w-auto min-w-[140px]"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">To Date</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) => onFilterChange('dateTo', e.target.value)}
                      className="w-auto min-w-[140px]"
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={onClearFilters} 
                className="whitespace-nowrap"
              >
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
