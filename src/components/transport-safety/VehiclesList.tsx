
import React from 'react';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import VehiclesListView from './VehiclesListView';
import VehicleSearchBar from './filters/VehicleSearchBar';
import VehicleBasicFilters from './filters/VehicleBasicFilters';
import VehicleAdvancedFilters from './filters/VehicleAdvancedFilters';
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
    showAdvancedFilters,
    setShowAdvancedFilters,
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
      <div className="mb-6 flex flex-col space-y-4 md:space-y-0 md:space-x-4 items-end">
        <div className="w-full flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 w-full">
            <div className="flex-grow">
              <VehicleSearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>
            
            {/* Basic Filters */}
            <VehicleBasicFilters
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              vehicleTypes={vehicleTypes}
            />
          </div>

          {/* Advanced Filters */}
          <VehicleAdvancedFilters
            showAdvancedFilters={showAdvancedFilters}
            setShowAdvancedFilters={setShowAdvancedFilters}
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
