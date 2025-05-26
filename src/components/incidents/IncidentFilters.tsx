
import { useState } from 'react';
import { Search, Calendar, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-lg">Filters</h2>
          {activeAdvancedFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeAdvancedFilterCount} active
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
            
            {/* Advanced Filters Section */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Collapsible>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Advanced Filters</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ChevronDown className="h-4 w-4" />
                      <span className="sr-only">Toggle advanced filters</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select 
                        value={filters.type} 
                        onValueChange={(value) => onFilterChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          <SelectItem value="">All Types</SelectItem>
                          <SelectItem value="Incident">Incident</SelectItem>
                          <SelectItem value="Near Miss">Near Miss</SelectItem>
                          <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={filters.facility} 
                        onValueChange={(value) => onFilterChange('facility', value)}
                        disabled={!filters.location || availableFacilities.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Facility" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          <SelectItem value="">All Facilities</SelectItem>
                          {availableFacilities.map(facility => (
                            <SelectItem key={facility} value={facility}>{facility}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select 
                        value={filters.owner} 
                        onValueChange={(value) => onFilterChange('owner', value)}
                        disabled={availableOwners.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Owner" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          <SelectItem value="">All Owners</SelectItem>
                          {availableOwners.map(owner => (
                            <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={filters.involvedRole} 
                        onValueChange={(value) => onFilterChange('involvedRole', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Person Involved Role" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          <SelectItem value="">Any Role</SelectItem>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TooltipProvider>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={filters.isVoided} 
                            onCheckedChange={(checked) => onFilterChange('isVoided', checked)}
                            id="voided-filter"
                          />
                          <label htmlFor="voided-filter" className="text-sm font-medium">
                            Voided Incidents
                          </label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-gray-500">(?)</span>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="w-60">Show only incidents that have been marked as voided.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={filters.wasReopened} 
                            onCheckedChange={(checked) => onFilterChange('wasReopened', checked)}
                            id="reopened-filter"
                          />
                          <label htmlFor="reopened-filter" className="text-sm font-medium">
                            Reopened Incidents
                          </label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-gray-500">(?)</span>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="w-60">Show only incidents that have been reopened after being closed.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={filters.hasAttachments} 
                            onCheckedChange={(checked) => onFilterChange('hasAttachments', checked)}
                            id="attachments-filter"
                          />
                          <label htmlFor="attachments-filter" className="text-sm font-medium">
                            Has Attachments
                          </label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-gray-500">(?)</span>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="w-60">Show only incidents with file attachments (images, documents, etc.).</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default IncidentFilters;
