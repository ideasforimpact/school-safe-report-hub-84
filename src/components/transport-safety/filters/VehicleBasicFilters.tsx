
import React from 'react';
import { Filter, FileCheck, FileX, FileWarning } from 'lucide-react';
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
  vehicleTypes: string[];
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
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium mr-2">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm font-medium mr-2">Type:</span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {vehicleTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center">
          <span className="text-sm font-medium mr-2">Document:</span>
          <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by document" />
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
      </div>

      <div className="flex flex-wrap items-center justify-between border-t pt-3 mt-1">
        <div className="flex flex-wrap gap-4">
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

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <>
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} filters active
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleBasicFilters;
