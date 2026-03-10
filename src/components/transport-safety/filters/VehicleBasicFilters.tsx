
import React from 'react';
import { Filter, FileCheck, FileX, FileWarning, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface DocumentStatusFilters {
  valid: boolean;
  expired: boolean;
  expiring_soon: boolean;
}

interface VehicleBasicFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  vehicleTypes: { id: string; name: string }[];
  documentTypeFilter: string;
  setDocumentTypeFilter: (value: string) => void;
  documentStatusFilters: DocumentStatusFilters;
  toggleDocumentStatusFilter: (status: 'valid' | 'expired' | 'expiring_soon') => void;
  activeFiltersCount: number;
  clearAllFilters: () => void;
}

const VehicleBasicFilters: React.FC<VehicleBasicFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  vehicleTypes,
  documentTypeFilter,
  setDocumentTypeFilter,
  documentStatusFilters,
  toggleDocumentStatusFilter,
  activeFiltersCount,
  clearAllFilters
}) => {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px] h-10">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {[...vehicleTypes]
                .sort((a, b) => {
                  const aIsOthers = a.name.toLowerCase() === 'others' || a.name.toLowerCase() === 'other';
                  const bIsOthers = b.name.toLowerCase() === 'others' || b.name.toLowerCase() === 'other';
                  if (aIsOthers && !bIsOthers) return 1; // a goes after b
                  if (!aIsOthers && bIsOthers) return -1; // a goes before b
                  return a.name.localeCompare(b.name);
                })
                .map((vehicleType) => (
                  <SelectItem key={vehicleType.id} value={vehicleType.id}>
                    {vehicleType.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

       
        
        
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="valid-status" 
            checked={documentStatusFilters.valid}
            onCheckedChange={() => toggleDocumentStatusFilter('valid')}
            className={`h-4 w-4 ${documentStatusFilters.valid ? 'bg-green-500 text-white' : ''}`}
          />
          <Label htmlFor="valid-status" className={`flex items-center cursor-pointer text-xs ${documentStatusFilters.valid ? 'font-medium text-green-700' : ''}`}>
            <FileCheck className={`h-3.5 w-3.5 mr-1 ${documentStatusFilters.valid ? 'text-green-600' : 'text-gray-500'}`} />
            <span>{documentStatusFilters.valid ? 'All Valid' : 'Valid'}</span>
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="expired-status" 
            checked={documentStatusFilters.expired}
            onCheckedChange={() => toggleDocumentStatusFilter('expired')}
            className={`h-4 w-4 ${documentStatusFilters.expired ? 'bg-red-500 text-white' : ''}`}
          />
          <Label htmlFor="expired-status" className={`flex items-center cursor-pointer text-xs ${documentStatusFilters.expired ? 'font-medium text-red-700' : ''}`}>
            <FileX className={`h-3.5 w-3.5 mr-1 ${documentStatusFilters.expired ? 'text-red-600' : 'text-gray-500'}`} />
            <span>{documentStatusFilters.expired ? 'Any Expired/Missing' : 'Expired'}</span>
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="expiring-status" 
            checked={documentStatusFilters.expiring_soon}
            onCheckedChange={() => toggleDocumentStatusFilter('expiring_soon')}
            className={`h-4 w-4 ${documentStatusFilters.expiring_soon ? 'bg-yellow-500 text-white' : ''}`}
          />
          <Label htmlFor="expiring-status" className={`flex items-center cursor-pointer text-xs ${documentStatusFilters.expiring_soon ? 'font-medium text-yellow-700' : ''}`}>
            <FileWarning className={`h-3.5 w-3.5 mr-1 ${documentStatusFilters.expiring_soon ? 'text-yellow-600' : 'text-gray-500'}`} />
            <span>{documentStatusFilters.expiring_soon ? 'Any Expiring Soon' : 'Expiring Soon'}</span>
          </Label>
        </div>
        {activeFiltersCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAllFilters}
            className="h-10 text-xs flex items-center gap-1"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters ({activeFiltersCount})
          </Button>
        )}
      </div>
    </>
  );
};

export default VehicleBasicFilters;
