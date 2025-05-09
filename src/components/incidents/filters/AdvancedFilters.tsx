
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdvancedFiltersProps {
  filters: {
    type: string;
    facility: string;
    owner: string;
    involvedRole: string;
    isVoided: boolean;
    wasReopened: boolean;
    hasAttachments: boolean;
    location: string;
  };
  onFilterChange: (field: string, value: any) => void;
  availableFacilities: string[];
  availableOwners: { id: string, name: string }[];
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFilterChange,
  availableFacilities,
  availableOwners,
}) => {
  return (
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
                <SelectContent>
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
                <SelectContent>
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
                <SelectContent>
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
                <SelectContent>
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
  );
};

export default AdvancedFilters;
