
import React from 'react';
import { Vehicle } from '@/types/transportSafety';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings, FileCheck, FileX, ShieldAlert, Flag, Edit } from 'lucide-react';
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
import { getPendingChallansFromVehicleChallans } from '@/services/transport-safety/vehicleService';

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
    const sortedVehicles = React.useMemo(() => {
      return [...vehicles].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    }, [vehicles]);

    const {
      paginatedItems,
      currentPage,
      setCurrentPage,
      totalPages
    } = usePagination(sortedVehicles, 10);

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

  // Legacy function - check verification_data
  const hasChallanFromVerification = (vehicle: Vehicle) => {
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

  // Check for pending challans from vehicle_challans table
  const hasPendingChallans = (vehicle: Vehicle) => {
    const pending = getPendingChallansFromVehicleChallans(vehicle.vehicleChallans || null);
    return pending.length > 0;
  };
  
  // Get pending challan count
  const getPendingChallanCount = (vehicle: Vehicle) => {
    const pending = getPendingChallansFromVehicleChallans(vehicle.vehicleChallans || null);
    return pending.length;
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

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-left">Type</TableHead>
              <TableHead className="w-[150px] text-left">Internal Vehicle Name</TableHead>
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
              const vehicleHasChallan = hasPendingChallans(vehicle);
              const pendingChallanCount = getPendingChallanCount(vehicle);
              const rowClassName = hasVerification ? getVehicleRowClassName(vehicle) : "hover:bg-muted/50 border-l-4 border-l-gray-300";
              
              return <TableRow key={vehicle.id} className={rowClassName}>
                  <TableCell>
                    <div className="bg-gray-100 p-2 rounded-lg inline-flex">
                      <VehicleTypeIcon type={vehicle.type} icon={vehicle.vehicleTypeIcon} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-left">
                      {vehicle.internalVehicleName || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-left">
                      <div className="text-left">
                        <div className="font-medium text-left">{vehicle.internalVehicleName || '-'}</div>
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
                    {vehicleHasChallan ? (
                      <div className="flex justify-start">
                        <Badge variant="outline" className="bg-orange-100 border-orange-200 text-orange-800 text-xs flex items-center gap-1 w-fit">
                          <Flag className="h-4 w-4 text-orange-600" />
                          <span>Yes</span>
                          {pendingChallanCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 text-xs font-bold text-white bg-orange-600 rounded-full ml-1">
                              {pendingChallanCount}
                            </span>
                          )}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <span className="text-gray-500 text-xs">-</span>
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

    </div>
  );
};

export default VehiclesListView;
