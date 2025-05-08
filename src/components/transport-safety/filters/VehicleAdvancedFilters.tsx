
import React from 'react';
import { ChevronDown, ChevronUp, FileCheck, FileX, FileWarning } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface DocumentStatusFilters {
  valid: boolean;
  expired: boolean;
  expiring_soon: boolean;
}

interface VehicleAdvancedFiltersProps {
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (value: boolean) => void;
  documentTypeFilter: string;
  setDocumentTypeFilter: (value: string) => void;
  documentStatusFilters: DocumentStatusFilters;
  toggleDocumentStatusFilter: (status: 'valid' | 'expired' | 'expiring_soon') => void;
  activeFiltersCount: number;
  clearAllFilters: () => void;
}

const VehicleAdvancedFilters: React.FC<VehicleAdvancedFiltersProps> = ({
  showAdvancedFilters,
  setShowAdvancedFilters,
  documentTypeFilter,
  setDocumentTypeFilter,
  documentStatusFilters,
  toggleDocumentStatusFilter,
  activeFiltersCount,
  clearAllFilters
}) => {
  return (
    <Collapsible 
      open={showAdvancedFilters} 
      onOpenChange={setShowAdvancedFilters}
      className="border rounded-md p-2 bg-gray-50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-sm font-medium">Advanced Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        <div className="flex items-center">
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="mr-2 text-xs"
            >
              Clear all
            </Button>
          )}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              {showAdvancedFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      
      <CollapsibleContent className="mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Document Type Filter */}
          <div>
            <Label className="text-xs mb-1 block">Document Type</Label>
            <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Filter by document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="fitness">Fitness Certificate</SelectItem>
                <SelectItem value="pollution">Pollution Certificate</SelectItem>
                <SelectItem value="registration">Registration</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Document Status Filters */}
          <div>
            <Label className="text-xs mb-1 block">Document Status</Label>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-1">
                <Checkbox 
                  id="valid-status" 
                  checked={documentStatusFilters.valid}
                  onCheckedChange={() => toggleDocumentStatusFilter('valid')}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="valid-status" className="flex items-center cursor-pointer text-xs">
                  <FileCheck className="h-3 w-3 mr-1 text-green-600" />
                  <span>Valid</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-1">
                <Checkbox 
                  id="expired-status" 
                  checked={documentStatusFilters.expired}
                  onCheckedChange={() => toggleDocumentStatusFilter('expired')}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="expired-status" className="flex items-center cursor-pointer text-xs">
                  <FileX className="h-3 w-3 mr-1 text-red-600" />
                  <span>Expired</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-1">
                <Checkbox 
                  id="expiring-status" 
                  checked={documentStatusFilters.expiring_soon}
                  onCheckedChange={() => toggleDocumentStatusFilter('expiring_soon')}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="expiring-status" className="flex items-center cursor-pointer text-xs">
                  <FileWarning className="h-3 w-3 mr-1 text-yellow-600" />
                  <span>Expiring Soon</span>
                </Label>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default VehicleAdvancedFilters;
