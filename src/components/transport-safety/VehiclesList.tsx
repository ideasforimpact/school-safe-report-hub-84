
import React, { useState } from 'react';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Bus } from 'lucide-react';
import { Vehicle } from '@/types/transportSafety';
import VehiclesListView from './VehiclesListView';
import AddVehicleDialog from './AddVehicleDialog';

const VehiclesList: React.FC = () => {
  const { vehicles } = useTransportSafety();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchQuery 
      ? vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    const matchesStatus = statusFilter === 'all' ? true : vehicle.status === statusFilter;
    const matchesType = typeFilter === 'all' ? true : vehicle.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const vehicleTypes = [...new Set(vehicles.map(vehicle => vehicle.type))];
  
  return (
    <div>
      {/* Filters section */}
      <div className="mb-6 flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 items-end">
        {/* Search */}
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
        
        {/* Filters */}
        <div className="flex items-center gap-4">
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
