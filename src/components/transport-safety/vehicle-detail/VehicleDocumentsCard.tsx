
import React, { useState } from 'react';
import { FileX, FileCheck, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DocumentStatusBadge from '@/components/transport-safety/DocumentStatusBadge';
import { Vehicle, VehicleChallans } from '@/types/transportSafety';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  getDocumentStatus, 
  getDocumentStatusColor
} from '@/utils/transport-safety/documentStatusUtils';
import ChallanDetailsDialog from '../ChallanDetailsDialog';

interface VehicleDocumentsCardProps {
  vehicle: Vehicle;
}

const VehicleDocumentsCard: React.FC<VehicleDocumentsCardProps> = ({ vehicle }) => {
  const { documents } = vehicle;
  const [vehicleChallans] = useState<VehicleChallans | null>(vehicle.vehicleChallans || null);
  const [showChallanDetails, setShowChallanDetails] = useState(false);
  
  // Check if vehicle has verification data
  const hasVerificationData = vehicle.verificationData && vehicle.verificationData.length > 0;
  
  // Get document statuses only if verification data exists
  const insuranceStatus = hasVerificationData ? getDocumentStatus(vehicle, 'insurance') : { status: 'unverified', expiryDate: null };
  const fcStatus = hasVerificationData ? getDocumentStatus(vehicle, 'fitness') : { status: 'unverified', expiryDate: null };
  const pollutionStatus = hasVerificationData ? getDocumentStatus(vehicle, 'pollution') : { status: 'unverified', expiryDate: null };
  
  const getDocumentIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <FileCheck className="h-4 w-4 text-green-600" />;
      case 'expired':
      case 'missing': // Treat missing as expired
        return <FileX className="h-4 w-4 text-red-600" />;
      case 'expiring_soon':
        return <ShieldAlert className="h-4 w-4 text-yellow-600" />;
      case 'unverified':
        return <FileX className="h-4 w-4 text-gray-400" />;
      default:
        return <FileX className="h-4 w-4 text-gray-400" />;
    }
  };
  
  // Format date in a user-friendly way
  const formatDate = (dateStr: Date | null | undefined): string => {
    if (!dateStr) return 'Not Available';
    
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };
  const latestSuccessLog = React.useMemo(() => {
    const logs = vehicleChallans?.challan_history_log;
    if (!logs || typeof logs !== 'object') return null;

    const successLogs = Object.entries(logs).filter(
      ([_, entry]: any) => entry?.data?.status_code === 200
    );

    if (successLogs.length === 0) return null;

    successLogs.sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );

    const [timestamp, log]: any = successLogs[0];

    return {
      timestamp,
      provider: log.provider,
      data: log.data?.data,
    };
  }, [vehicleChallans]);
  

 const challanCount = React.useMemo(() => {
    const challanData = latestSuccessLog?.data;
    if (!challanData) return 0;

    if (Array.isArray(challanData.challan_data)) {
      return challanData.challan_data.length;
    }

    if (challanData?.challan_details?.challans) {
      return challanData.challan_details.challans.length;
    }

    return 0;
  }, [latestSuccessLog]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-left">Document Status</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Document expiry details section */}
        <div className="mb-4 space-y-2 border rounded-md p-3 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Insurance</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs flex items-center gap-1 px-2 py-1", 
                hasVerificationData 
                  ? getDocumentStatusColor(insuranceStatus.status === 'missing' ? 'expired' : insuranceStatus.status)
                  : 'bg-gray-100 border-gray-200 text-gray-800'
              )}
            >
              {getDocumentIcon(insuranceStatus.status)}
              <span>Expires: {hasVerificationData ? formatDate(insuranceStatus.expiryDate) : 'Not Available'}</span>
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Fitness Certificate</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs flex items-center gap-1 px-2 py-1", 
                hasVerificationData 
                  ? getDocumentStatusColor(fcStatus.status === 'missing' ? 'expired' : fcStatus.status)
                  : 'bg-gray-100 border-gray-200 text-gray-800'
              )}
            >
              {getDocumentIcon(fcStatus.status)}
              <span>Expires: {hasVerificationData ? formatDate(fcStatus.expiryDate) : 'Not Available'}</span>
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Pollution (PUC)</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs flex items-center gap-1 px-2 py-1", 
                hasVerificationData 
                  ? getDocumentStatusColor(pollutionStatus.status === 'missing' ? 'expired' : pollutionStatus.status)
                  : 'bg-gray-100 border-gray-200 text-gray-800'
              )}
            >
              {getDocumentIcon(pollutionStatus.status)}
              <span>Expires: {hasVerificationData ? formatDate(pollutionStatus.expiryDate) : 'Not Available'}</span>
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Challan Status</span>
            {challanCount > 0 ? (
              <button
                onClick={() => setShowChallanDetails(true)}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium underline cursor-pointer"
              >
                Click here to View Details
              </button>
            ) : (
              <Badge variant="outline" className="bg-green-100 border-green-200 text-green-800 text-xs flex items-center gap-1">
                <span>No Challan Found</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Challan Details Dialog */}
        <ChallanDetailsDialog
          open={showChallanDetails}
          onOpenChange={setShowChallanDetails}
          vehicleChallans={vehicleChallans}
        />

        <div className="space-y-4">
          {documents.map(document => (
            <div key={document.id} className="flex justify-between items-center">
              <div className="text-left">
                <div className="font-medium text-left">
                  {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
                </div>
                <div className="text-sm text-gray-500 text-left">
                  Expires: {new Date(document.expiryDate).toLocaleDateString()}
                </div>
              </div>
              <DocumentStatusBadge status={document.status} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleDocumentsCard;
