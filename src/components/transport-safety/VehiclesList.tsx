
import React from 'react';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import VehiclesListView from './VehiclesListView';
import VehicleSearchBar from './filters/VehicleSearchBar';
import VehicleBasicFilters from './filters/VehicleBasicFilters';
import EmptyVehiclesState from './EmptyVehiclesState';
import { useVehicleFilters } from './filters/useVehicleFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VehiclesListProps {
  showAddVehicle: boolean;
  setShowAddVehicle: (show: boolean) => void;
}

const VehiclesList: React.FC<VehiclesListProps> = ({ showAddVehicle, setShowAddVehicle }) => {
  const { vehicles, loading, error, fetchVehicles } = useTransportSafety();
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
  
  // Loading state
  if (loading) {
    return (
      <div>
        <div className="mb-6 flex flex-col space-y-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-1/3" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  const handleRefresh = () => {
    fetchVehicles();
  };
  
  return (
    <div>
      {/* Filters section */}
      <div className="mb-6 flex flex-col space-y-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 w-full">
          <VehicleSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          
          <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Vehicles display */}
      {filteredVehicles.length === 0 ? (
        <EmptyVehiclesState setShowAddVehicle={setShowAddVehicle} />
      ) : (
        <VehiclesListView vehicles={filteredVehicles} onRefresh={handleRefresh} />
      )}
    </div>
  );
};

export default VehiclesList;
