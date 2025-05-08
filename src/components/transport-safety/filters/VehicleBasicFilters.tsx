
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
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-10">
              <SelectValue placeholder="Status" />
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px] h-10">
              <SelectValue placeholder="Type" />
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
          <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Document" />
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
        
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="h-10 text-xs flex items-center gap-1"
          >
            <Badge variant="secondary" className="text-xs mr-1">
              {activeFiltersCount}
            </Badge>
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-2">
        <div className="flex items-center space-x-2">
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
        
        <div className="flex items-center space-x-2">
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
        
        <div className="flex items-center space-x-2">
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
    </>
  );
};

export default VehicleBasicFilters;
