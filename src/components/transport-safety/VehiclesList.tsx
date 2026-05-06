
import React, { useEffect, useState } from 'react';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import VehiclesListView from './VehiclesListView';
import VehicleSearchBar from './filters/VehicleSearchBar';
import VehicleBasicFilters from './filters/VehicleBasicFilters';
import EmptyVehiclesState from './EmptyVehiclesState';
import AddVehicleDialog from './AddVehicleDialog';
import { useVehicleFilters } from './filters/useVehicleFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileText, FileUp, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { getDocumentStatus, getLatestVerificationLog, findVerificationField } from '@/utils/transport-safety/documentStatusUtils';
import { Vehicle } from '@/types/transportSafety';
import ImportVehiclesDialog from './ImportVehiclesDialog';
import { getPendingChallansFromVehicleChallans } from '@/services/transport-safety/vehicleService';
import Loader from '../common/Loader';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

interface VehiclesListProps {
  showAddVehicle: boolean;
  setShowAddVehicle: (show: boolean) => void;
  onVehiclesChanged: (data: {
    total: number;
    filtered: number;
    hasFetched: boolean;
    vehicles: Vehicle[];
  }) => void;
}

const VehiclesList: React.FC<VehiclesListProps> = ({ showAddVehicle, setShowAddVehicle,onVehiclesChanged }) => {
  const { vehicles, loading, error, hasFetched , fetchVehicles, } = useTransportSafety();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  // State for edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>(undefined);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  useEffect(() => {
    if (!loading) {
      setTimeout(() => setShowLoader(false), 300); 
    }
  }, [loading]);

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
  
  // Handle edit vehicle
  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEditDialog(true);
  };
  
  // Handle close edit dialog
  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedVehicle(undefined);
  };
  
  // Function to check if a vehicle has pending challan records from vehicle_challans table
  const hasChallan = (vehicle) => {
    const pending = getPendingChallansFromVehicleChallans(vehicle.vehicleChallans || null);
    return pending.length > 0;
  };
  
  // Get document statuses for a vehicle
  const getDocumentStatuses = (vehicle) => {
    const insuranceStatus = getDocumentStatus(vehicle, 'insurance').status;
    const fcStatus = getDocumentStatus(vehicle, 'fitness').status;
    const pollutionStatus = getDocumentStatus(vehicle, 'pollution').status;
    
    return {
      insurance: insuranceStatus === 'missing' ? 'expired' : insuranceStatus,
      fitness: fcStatus === 'missing' ? 'expired' : fcStatus,
      pollution: pollutionStatus === 'missing' ? 'expired' : pollutionStatus
    };
  };
  
  // Get document expiration dates
  const getDocumentDates = (vehicle) => {
    const latestLog = getLatestVerificationLog(vehicle);
    if (!latestLog) return { fcUpto: 'N/A', insuranceUpto: 'N/A', pucUpto: 'N/A' };
    
    const fcField = findVerificationField(latestLog, 'fit_up_to');
    const insuranceField = findVerificationField(latestLog, 'insurance_upto');
    const pucField = findVerificationField(latestLog, 'pucc_upto');
    
    return {
      fcUpto: fcField?.value || 'N/A',
      insuranceUpto: insuranceField?.value || 'N/A',
      pucUpto: pucField?.value || 'N/A'
    };
  };
  useEffect(() => {
  onVehiclesChanged({
    total: vehicles.length,
    filtered: filteredVehicles.length,
    hasFetched,
    vehicles,
  });
}, [vehicles, filteredVehicles, onVehiclesChanged]);

  // Export vehicles to Excel
  const exportToExcel = () => {
    try {
      // Convert vehicle data to a format suitable for Excel
      const exportData = filteredVehicles.map(vehicle => {
        const documentStatuses = getDocumentStatuses(vehicle);
        const documentDates = getDocumentDates(vehicle);
        const vehicleHasChallan = hasChallan(vehicle);
        
        return {
          'Registration Number': vehicle.registrationNumber,
          'Model': vehicle.model,
          'Type': vehicle.typeName || vehicle.type || 'Unknown',
          'Year': vehicle.year,
          'Vehicle Status': vehicle.status,
          'Driver': vehicle.driver || 'N/A',
          'Route': vehicle.route || 'N/A',
          'FC Status': documentStatuses.fitness,
          'FC Upto': documentDates.fcUpto,
          'Insurance Status': documentStatuses.insurance,
          'Insurance Upto': documentDates.insuranceUpto,
          'PUC Status': documentStatuses.pollution,
          'PUC Upto': documentDates.pucUpto,
          'Has Challan': vehicleHasChallan ? 'Yes' : 'No',
          'Last Verified': vehicle.verificationDate ? new Date(vehicle.verificationDate).toLocaleDateString() : 'Never'
        };
      });
      
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
  // if (loading) {
  //   return (
  //     <div>
  //       <div className="mb-6 flex flex-col space-y-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
  //         <Skeleton className="h-10 w-full" />
  //         <Skeleton className="h-8 w-1/3" />
  //       </div>
  //       <div className="space-y-4">
  //         <Skeleton className="h-64 w-full" />
  //       </div>
  //     </div>
  //   );
  // }
  if (showLoader) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader text="Loading vehicles..." />
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
    {/* Vehicles display with export button */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium">Vehicle List</h3>
      <div className="flex gap-2">
        {!isReadOnlySwitchedContext && (
          <Button 
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2"
              variant="secondary"
              disabled={loading}
            >
              <FileUp className="h-4 w-4" />
              <span>Import Vehicles</span>
            </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportToExcel} 
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-all flex items-center gap-1 shadow-sm"
        >
          <FileText className="h-4 w-4" />
          <span>Export to Excel</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          className="flex items-center justify-center w-9 h-9 p-0"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
          {/* Filters section - moved after Vehicle List heading */}
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
    {/* --- Only this part changes based on filter results --- */}
    {filteredVehicles.length === 0 ? (
      <EmptyVehiclesState
        setShowAddVehicle={setShowAddVehicle}
        statusFilter={statusFilter}
      />
    ) : (
      <VehiclesListView
        vehicles={filteredVehicles}
        onRefresh={handleRefresh}
        onEditVehicle={handleEditVehicle}
      />
    )}
    {/* Edit Vehicle Dialog */}
    <AddVehicleDialog
      open={showEditDialog}
      onClose={handleCloseEditDialog}
      vehicle={selectedVehicle}
    />
   <ImportVehiclesDialog
      isOpen={isImportDialogOpen && !isReadOnlySwitchedContext}
      onClose={() => setIsImportDialogOpen(false)}
      onSuccess={() => {
        fetchVehicles();
      }}
    />

  </div>
);
};

export default VehiclesList;
