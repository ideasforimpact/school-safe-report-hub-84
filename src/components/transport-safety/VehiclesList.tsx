
import React, { useState } from 'react';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Bus, FileCheck, FileX, FileWarning, ChevronDown, ChevronUp } from 'lucide-react';
import { Vehicle } from '@/types/transportSafety';
import VehiclesListView from './VehiclesListView';
import AddVehicleDialog from './AddVehicleDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const VehiclesList: React.FC = () => {
  const { vehicles } = useTransportSafety();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Document filters
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [documentStatusFilters, setDocumentStatusFilters] = useState({
    valid: false,
    expired: false,
    expiring_soon: false,
  });

  const hasActiveDocumentStatusFilters = Object.values(documentStatusFilters).some(value => value);

  const filteredVehicles = vehicles.filter(vehicle => {
    // Basic filters
    const matchesSearch = searchQuery 
      ? vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    const matchesStatus = statusFilter === 'all' ? true : vehicle.status === statusFilter;
    const matchesType = typeFilter === 'all' ? true : vehicle.type === typeFilter;
    
    // Document filters
    let matchesDocumentType = true;
    let matchesDocumentStatus = !hasActiveDocumentStatusFilters;

    if (documentTypeFilter !== 'all' || hasActiveDocumentStatusFilters) {
      const relevantDocuments = vehicle.documents.filter(doc => 
        documentTypeFilter === 'all' ? true : doc.type === documentTypeFilter
      );
      
      // If we're filtering by document type and there are no matching documents
      if (documentTypeFilter !== 'all' && relevantDocuments.length === 0) {
        matchesDocumentType = false;
      }
      
      // Check document statuses if any status filters are active
      if (hasActiveDocumentStatusFilters) {
        matchesDocumentStatus = relevantDocuments.some(doc => documentStatusFilters[doc.status]);
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDocumentType && (hasActiveDocumentStatusFilters ? matchesDocumentStatus : true);
  });

  const vehicleTypes = [...new Set(vehicles.map(vehicle => vehicle.type))];

  const toggleDocumentStatusFilter = (status: 'valid' | 'expired' | 'expiring_soon') => {
    setDocumentStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };
  
  const getActiveFiltersCount = () => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (documentTypeFilter !== 'all') count++;
    if (documentStatusFilters.valid) count++;
    if (documentStatusFilters.expired) count++;
    if (documentStatusFilters.expiring_soon) count++;
    return count;
  };

  const clearAllFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setDocumentTypeFilter('all');
    setDocumentStatusFilters({
      valid: false,
      expired: false,
      expiring_soon: false,
    });
    setSearchQuery('');
  };

  const activeFiltersCount = getActiveFiltersCount();
  
  return (
    <div>
      {/* Filters section */}
      <div className="mb-6 flex flex-col space-y-4 md:space-y-0 md:space-x-4 items-end">
        {/* Search */}
        <div className="w-full flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 w-full">
            <div className="flex-grow">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search vehicles by registration or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            {/* Basic Filters */}
            <div className="flex items-center gap-4 flex-wrap">
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
                      <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={() => setShowAddVehicle(true)} className="ml-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          <Collapsible 
            open={showAdvancedFilters} 
            onOpenChange={setShowAdvancedFilters}
            className="border rounded-md p-4 bg-gray-50"
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
                  <Button variant="ghost" size="sm">
                    {showAdvancedFilters ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            
            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Document Type Filter */}
                <div>
                  <Label className="block mb-2">Document Type</Label>
                  <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                    <SelectTrigger>
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
                  <Label className="block mb-2">Document Status</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="valid-status" 
                        checked={documentStatusFilters.valid}
                        onCheckedChange={() => toggleDocumentStatusFilter('valid')}
                      />
                      <Label htmlFor="valid-status" className="flex items-center cursor-pointer">
                        <FileCheck className="h-4 w-4 mr-1 text-green-600" />
                        <span>Valid</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="expired-status" 
                        checked={documentStatusFilters.expired}
                        onCheckedChange={() => toggleDocumentStatusFilter('expired')}
                      />
                      <Label htmlFor="expired-status" className="flex items-center cursor-pointer">
                        <FileX className="h-4 w-4 mr-1 text-red-600" />
                        <span>Expired</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="expiring-status" 
                        checked={documentStatusFilters.expiring_soon}
                        onCheckedChange={() => toggleDocumentStatusFilter('expiring_soon')}
                      />
                      <Label htmlFor="expiring-status" className="flex items-center cursor-pointer">
                        <FileWarning className="h-4 w-4 mr-1 text-yellow-600" />
                        <span>Expiring Soon</span>
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Vehicles display */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="flex justify-center mb-4">
            <Bus className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Vehicles Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            No vehicles match your current filters. Try changing your filters or add a new vehicle.
          </p>
          <Button onClick={() => setShowAddVehicle(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Vehicle
          </Button>
        </div>
      ) : (
        <VehiclesListView vehicles={filteredVehicles} />
      )}

      {/* Add Vehicle Dialog */}
      <AddVehicleDialog 
        open={showAddVehicle} 
        onClose={() => setShowAddVehicle(false)} 
      />
    </div>
  );
};

export default VehiclesList;
