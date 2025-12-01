
import React, { useState } from 'react';
import { Vehicle } from '@/types/transportSafety';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings, FileCheck, FileX, ShieldAlert, Flag, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import VehicleStatusBadge from './VehicleStatusBadge';
import VehicleTypeIcon from './VehicleTypeIcon';
import { usePagination } from '@/hooks/usePagination';
import { cn } from '@/lib/utils';
import { 
  getDocumentStatus, 
  getDocumentStatusColor, 
  getVehicleRowClassName,
  getLatestVerificationLog,
  getLatestVerificationFieldValue
} from '@/utils/transport-safety/documentStatusUtils';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';

interface VehiclesListViewProps {
  vehicles: Vehicle[];
  onRefresh?: () => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
}

const VehiclesListView: React.FC<VehiclesListViewProps> = ({
  vehicles,
  onRefresh,
  onEditVehicle
}) => {
  const { updateVehicle } = useTransportSafety();
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [updatingVehicleId, setUpdatingVehicleId] = useState<string | null>(null);
  
  const {
    paginatedItems,
    currentPage,
    setCurrentPage,
    totalPages
  } = usePagination(vehicles, 10);

  const getDocumentIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <FileCheck className="h-4 w-4 text-green-600" />;
      case 'expired':
      case 'missing': // Treat missing as expired
        return <FileX className="h-4 w-4 text-red-600" />;
      case 'expiring_soon':
        return <ShieldAlert className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileX className="h-4 w-4 text-gray-400" />;
    }
  };

  const hasChallan = (vehicle: Vehicle) => {
    // Check for challan in verification log data
    if (vehicle.verificationData) {
      // Get the latest verification log
      const latestLog = getLatestVerificationLog(vehicle);
      if (!latestLog) return false;
      
      // Find challan_details in the latest log
      const challanDetails = latestLog.find(item => item.field === 'challan_details');
      if (challanDetails && challanDetails.value && 
          challanDetails.value.challan_details && 
          challanDetails.value.challan_details.challans && 
          challanDetails.value.challan_details.challans.length > 0) {
        return true;
      }
    }
    
    // Fallback to check for any specific notes or properties that indicate a challan
    return vehicle.documents.some(doc => 
      doc.notes?.toLowerCase().includes('challan') || 
      doc.issuedBy?.toLowerCase().includes('police') ||
      doc.provider?.toLowerCase().includes('police')
    );
  };

  // Check if vehicle has been verified
  const hasVerificationData = (vehicle: Vehicle) => {
    return vehicle.verificationData && vehicle.verificationData.length > 0;
  };

  // Get the correct status badge variant for the Status column
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleToggleActive = async (vehicle: Vehicle, newActiveState: boolean) => {
    // If turning off (deactivating), show consent dialog
    if (!newActiveState) {
      setSelectedVehicle(vehicle);
      setDeactivateDialogOpen(true);
      return;
    }

    // If turning on (activating), update directly
    await updateVehicleStatus(vehicle, true);
  };

  const updateVehicleStatus = async (vehicle: Vehicle, active: boolean) => {
    setUpdatingVehicleId(vehicle.id);
    try {
      // Update both active and status fields together
      await updateVehicle(vehicle.id, { 
        active,
        status: active ? 'active' : 'inactive'
      });
      toast.success(`Vehicle ${active ? 'activated' : 'deactivated'} successfully`);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      toast.error(`Failed to ${active ? 'activate' : 'deactivate'} vehicle`);
    } finally {
      setUpdatingVehicleId(null);
      setDeactivateDialogOpen(false);
      setSelectedVehicle(null);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (selectedVehicle) {
      await updateVehicleStatus(selectedVehicle, false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-left">Type</TableHead>
              <TableHead className="w-[150px] text-left">Vehicle Name</TableHead>
              <TableHead className="w-[150px] text-left">Registration</TableHead>
              <TableHead className="w-[120px] text-left">Status</TableHead>
              <TableHead className="w-[180px] text-left">Vehicle Status</TableHead>
              <TableHead className="w-[100px] text-left">Challan</TableHead>
              <TableHead className="w-[100px] text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map(vehicle => {
              const hasVerification = hasVerificationData(vehicle);
              const insuranceStatus = hasVerification ? getDocumentStatus(vehicle, 'insurance').status : 'unverified';
              const fcStatus = hasVerification ? getDocumentStatus(vehicle, 'fitness').status : 'unverified';
              const pollutionStatus = hasVerification ? getDocumentStatus(vehicle, 'pollution').status : 'unverified';
              const vehicleHasChallan = hasVerification ? hasChallan(vehicle) : false;
              const rowClassName = hasVerification ? getVehicleRowClassName(vehicle) : "hover:bg-muted/50 border-l-4 border-l-gray-300";
              
              return <TableRow key={vehicle.id} className={rowClassName}>
                  <TableCell>
                    <div className="bg-gray-100 p-2 rounded-lg inline-flex">
                      <VehicleTypeIcon type={vehicle.type} icon={vehicle.vehicleTypeIcon} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-left">
                      <div className="text-left">
                        <div className="font-medium text-left">{vehicle.model || (getLatestVerificationFieldValue(vehicle, 'maker_model') as string) || '-'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="text-sm font-medium text-gray-700 text-left">{vehicle.registrationNumber}</div>
                  </TableCell>
                  <TableCell className="text-left">
                    <Badge 
                      variant="outline" 
                      className={cn(getStatusBadgeVariant(vehicle.status))}
                    >
                      {getStatusLabel(vehicle.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex gap-1">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs flex items-center gap-1 px-2 py-1", 
                          hasVerification 
                            ? getDocumentStatusColor(insuranceStatus === 'missing' ? 'expired' : insuranceStatus)
                            : 'bg-gray-100 border-gray-200 text-gray-800'
                        )}
                      >
                        {getDocumentIcon(insuranceStatus)}
                        <span>Ins</span>
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs flex items-center gap-1 px-2 py-1", 
                          hasVerification 
                            ? getDocumentStatusColor(fcStatus === 'missing' ? 'expired' : fcStatus)
                            : 'bg-gray-100 border-gray-200 text-gray-800'
                        )}
                      >
                        {getDocumentIcon(fcStatus)}
                        <span>FC</span>
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs flex items-center gap-1 px-2 py-1", 
                          hasVerification 
                            ? getDocumentStatusColor(pollutionStatus === 'missing' ? 'expired' : pollutionStatus)
                            : 'bg-gray-100 border-gray-200 text-gray-800'
                        )}
                      >
                        {getDocumentIcon(pollutionStatus)}
                        <span>PUC</span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    {hasVerification ? (
                      vehicleHasChallan ? (
                        <div className="flex justify-start">
                          <Badge variant="outline" className="bg-orange-100 border-orange-200 text-orange-800 text-xs flex items-center gap-1 w-fit">
                          <Flag className="h-4 w-4 text-orange-600" />
                          <span>Yes</span>
                        </Badge>
                        </div>
                      ) : (
                        <div className="flex justify-start">
                        <span className="text-gray-500 text-xs">-</span>
                        </div>
                      )
                    ) : (
                      <div className="flex justify-start">
                      <span className="text-gray-400 text-xs">-</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex justify-start gap-1 items-center">
                      <Button asChild variant="ghost" size="icon">
                        <Link to={`/transport-safety/${vehicle.id}`}>
                            <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                      {onEditVehicle && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onEditVehicle(vehicle)}
                          title="Edit vehicle"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {updatingVehicleId === vehicle.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      ) : (
                        <Switch
                          checked={vehicle.active !== false}
                          onCheckedChange={(checked) => handleToggleActive(vehicle, checked)}
                          disabled={updatingVehicleId !== null}
                          title={vehicle.active !== false ? 'Deactivate vehicle' : 'Activate vehicle'}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>;
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </Button>
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
      )}

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Vehicle</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
              <p className="break-all whitespace-normal">
                Are you sure you want to deactivate{' '}
                {selectedVehicle?.internalVehicleName || selectedVehicle?.model || 'this vehicle'}{' '}
                ({selectedVehicle?.registrationNumber})?
              </p>
              <p>
                This will mark the vehicle as inactive. You can reactivate it later using the toggle.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingVehicleId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              disabled={updatingVehicleId !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {updatingVehicleId === selectedVehicle?.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deactivating...
                </>
              ) : (
                'Deactivate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehiclesListView;
