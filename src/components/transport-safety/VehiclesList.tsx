
import React from 'react';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import VehiclesListView from './VehiclesListView';
import VehicleSearchBar from './filters/VehicleSearchBar';
import VehicleBasicFilters from './filters/VehicleBasicFilters';
import EmptyVehiclesState from './EmptyVehiclesState';
import { useVehicleFilters } from './filters/useVehicleFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileExcel, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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
  
  // Export vehicles to Excel
  const exportToExcel = () => {
    try {
      // Convert vehicle data to a format suitable for Excel
      const exportData = filteredVehicles.map(vehicle => ({
        'Registration Number': vehicle.registrationNumber,
        'Make': vehicle.make,
        'Model': vehicle.model,
        'Type': vehicle.type,
        'Year': vehicle.year,
        'Status': vehicle.status,
        'Driver': vehicle.driver || 'N/A',
        'Route': vehicle.route || 'N/A',
        'Documents Count': vehicle.documents.length,
        'Last Verified': vehicle.verificationDate ? new Date(vehicle.verificationDate).toLocaleDateString() : 'Never'
      }));
      
      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicles");
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, `vehicle_data_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Vehicle data exported successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export vehicle data');
    }
  };
  
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

      {/* Vehicles display with export button */}
      {filteredVehicles.length === 0 ? (
        <EmptyVehiclesState setShowAddVehicle={setShowAddVehicle} />
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Vehicle List</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToExcel} 
                className="flex items-center gap-1"
              >
                <FileExcel className="h-4 w-4" />
                <span>Export to Excel</span>
              </Button>
            </div>
          </div>
          <VehiclesListView vehicles={filteredVehicles} onRefresh={handleRefresh} />
        </>
      )}
    </div>
  );
};

export default VehiclesList;
