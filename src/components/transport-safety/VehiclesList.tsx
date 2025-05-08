
import React from 'react';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import VehiclesListView from './VehiclesListView';
import VehicleSearchBar from './filters/VehicleSearchBar';
import VehicleBasicFilters from './filters/VehicleBasicFilters';
import EmptyVehiclesState from './EmptyVehiclesState';
import { useVehicleFilters } from './filters/useVehicleFilters';

interface VehiclesListProps {
  showAddVehicle: boolean;
  setShowAddVehicle: (show: boolean) => void;
}

const VehiclesList: React.FC<VehiclesListProps> = ({ showAddVehicle, setShowAddVehicle }) => {
  const { vehicles } = useTransportSafety();
  const {
    // State
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    documentTypeFilter,
    setDocumentTypeFilter,
    documentStatusFilters,
    
    // Derived values
    vehicleTypes,
    filteredVehicles,
    activeFiltersCount,
    
    // Actions
    toggleDocumentStatusFilter,
    clearAllFilters,
  } = useVehicleFilters(vehicles);
  
  return (
    <div>
      {/* Filters section */}
      <div className="mb-6 flex flex-col space-y-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 w-full">
          <div className="flex-grow">
            <VehicleSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
          
          {/* Basic Filters and Advanced Filters Combined */}
          <VehicleBasicFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            vehicleTypes={vehicleTypes}
            documentTypeFilter={documentTypeFilter}
            setDocumentTypeFilter={setDocumentTypeFilter}
            documentStatusFilters={documentStatusFilters}
            toggleDocumentStatusFilter={toggleDocumentStatusFilter}
            activeFiltersCount={activeFiltersCount}
            clearAllFilters={clearAllFilters}
          />
        </div>
      </div>

      {/* Vehicles display */}
      {filteredVehicles.length === 0 ? (
        <EmptyVehiclesState setShowAddVehicle={setShowAddVehicle} />
      ) : (
        <VehiclesListView vehicles={filteredVehicles} />
      )}
    </div>
  );
};

export default VehiclesList;
