
import React from 'react';
import { Vehicle } from '@/types/transportSafety';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, FileCheck, FileX, ShieldAlert, Flag } from 'lucide-react';
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
  getLatestVerificationLog
} from '@/utils/transport-safety/documentStatusUtils';
import { toast } from 'sonner';

interface VehiclesListViewProps {
  vehicles: Vehicle[];
  onRefresh?: () => void;
}

const VehiclesListView: React.FC<VehiclesListViewProps> = ({
  vehicles,
  onRefresh
}) => {
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

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-left">Type</TableHead>
              <TableHead className="text-left">Vehicle Details</TableHead>
              <TableHead className="w-[160px] text-left">Registration</TableHead>
              <TableHead className="w-[100px] text-left">Status</TableHead>
              <TableHead className="w-[180px] text-left">Vehicle Status</TableHead>
              <TableHead className="w-[80px] text-left">Challan</TableHead>
              <TableHead className="w-[60px] text-left">Actions</TableHead>
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
                      <VehicleTypeIcon type={vehicle.type} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-left">
                      <div className="text-left">
                        <div className="font-medium text-left">{vehicle.make} {vehicle.model}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="text-sm font-medium text-gray-700 text-left">{vehicle.registrationNumber}</div>
                  </TableCell>
                  <TableCell className="text-left">
                    <VehicleStatusBadge 
                      status={vehicle.status} 
                      verificationStatus={vehicle.verificationStatus}
                      verificationData={vehicle.verificationData}
                    />
                  </TableCell>
                  <TableCell className="text-left">
                    {!hasVerification ? (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-200" variant="outline">
                        Pending Verification
                      </Badge>
                    ) : (
                      <div className="flex gap-1">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs flex items-center gap-1 px-2 py-1", 
                            getDocumentStatusColor(insuranceStatus === 'missing' ? 'expired' : insuranceStatus)
                          )}
                        >
                          {getDocumentIcon(insuranceStatus)}
                          <span>Ins</span>
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs flex items-center gap-1 px-2 py-1", 
                            getDocumentStatusColor(fcStatus === 'missing' ? 'expired' : fcStatus)
                          )}
                        >
                          {getDocumentIcon(fcStatus)}
                          <span>FC</span>
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs flex items-center gap-1 px-2 py-1", 
                            getDocumentStatusColor(pollutionStatus === 'missing' ? 'expired' : pollutionStatus)
                          )}
                        >
                          {getDocumentIcon(pollutionStatus)}
                          <span>PUC</span>
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    {hasVerification ? (
                      vehicleHasChallan ? (
                        <Badge variant="outline" className="bg-orange-100 border-orange-200 text-orange-800 text-xs flex items-center gap-1">
                          <Flag className="h-4 w-4 text-orange-600" />
                          <span>Yes</span>
                        </Badge>
                      ) : (
                        <span className="text-gray-500 text-xs">-</span>
                      )
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex justify-start">
                      <Button asChild variant="ghost" size="icon">
                        <Link to={`/transport-safety/${vehicle.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
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
