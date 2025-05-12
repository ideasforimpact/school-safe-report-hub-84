
import React from 'react';
import { FileX, FileCheck, ShieldAlert, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DocumentStatusBadge from '@/components/transport-safety/DocumentStatusBadge';
import { Vehicle } from '@/types/transportSafety';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  getDocumentStatus, 
  getDocumentStatusColor,
  findVerificationField,
  getLatestVerificationLog
} from '@/utils/transport-safety/documentStatusUtils';

interface VehicleDocumentsCardProps {
  vehicle: Vehicle;
}

const VehicleDocumentsCard: React.FC<VehicleDocumentsCardProps> = ({ vehicle }) => {
  const { id: vehicleId, documents } = vehicle;
  
  // Get document statuses
  const insuranceStatus = getDocumentStatus(vehicle, 'insurance');
  const fcStatus = getDocumentStatus(vehicle, 'fitness');
  const pollutionStatus = getDocumentStatus(vehicle, 'pollution');
  
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
  
  // Check for challan details in verification data
  const hasChallanFromApi = () => {
    if (!vehicle.verificationData) return false;
    
    const verificationLog = vehicle.verificationData.find(item => item.field === 'verification_log');
    if (!verificationLog || !verificationLog.value) return false;
    
    // Get the latest verification timestamp
    const timestamps = Object.keys(verificationLog.value).sort().reverse();
    if (timestamps.length === 0) return false;
    
    // Get the latest verification data
    const latestData = verificationLog.value[timestamps[0]];
    if (!latestData) return false;
    
    // Check for challan data in the verification response
    const challanResponse = latestData.find((item: any) => item.field === 'challan_response');
    if (!challanResponse) return false;
    
    // Check if there are actual challan details in the response
    return challanResponse.value && 
           challanResponse.value.data && 
           Array.isArray(challanResponse.value.data) && 
           challanResponse.value.data.length > 0;
  };
  
  // Get the latest challan data from verification responses
  const getChallanDetails = () => {
    if (!vehicle.verificationData) return null;
    
    const verificationLog = vehicle.verificationData.find(item => item.field === 'verification_log');
    if (!verificationLog || !verificationLog.value) return null;
    
    // Get the latest verification timestamp
    const timestamps = Object.keys(verificationLog.value).sort().reverse();
    if (timestamps.length === 0) return null;
    
    // Get the latest verification data
    const latestData = verificationLog.value[timestamps[0]];
    if (!latestData) return null;
    
    // Get the challan response field
    const challanResponse = latestData.find((item: any) => item.field === 'challan_response');
    if (!challanResponse || !challanResponse.value || !challanResponse.value.data) return null;
    
    return challanResponse.value.data;
  };
  
  const hasChallanFromNotes = () => {
    // Check for any specific notes or properties that indicate a challan
    return documents.some(doc => 
      doc.notes?.toLowerCase().includes('challan') || 
      doc.issuedBy?.toLowerCase().includes('police') ||
      doc.provider?.toLowerCase().includes('police')
    );
  };
  
  const hasChallan = () => {
    return hasChallanFromApi() || hasChallanFromNotes();
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

  // Get challan details for display
  const challanDetails = getChallanDetails();

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
                getDocumentStatusColor(insuranceStatus.status === 'missing' ? 'expired' : insuranceStatus.status)
              )}
            >
              {getDocumentIcon(insuranceStatus.status)}
              <span>Expires: {formatDate(insuranceStatus.expiryDate)}</span>
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Fitness Certificate</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs flex items-center gap-1 px-2 py-1", 
                getDocumentStatusColor(fcStatus.status === 'missing' ? 'expired' : fcStatus.status)
              )}
            >
              {getDocumentIcon(fcStatus.status)}
              <span>Expires: {formatDate(fcStatus.expiryDate)}</span>
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Pollution (PUC)</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs flex items-center gap-1 px-2 py-1", 
                getDocumentStatusColor(pollutionStatus.status === 'missing' ? 'expired' : pollutionStatus.status)
              )}
            >
              {getDocumentIcon(pollutionStatus.status)}
              <span>Expires: {formatDate(pollutionStatus.expiryDate)}</span>
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Challan Status</span>
            {hasChallan() ? (
              <Badge variant="outline" className="bg-orange-100 border-orange-200 text-orange-800 text-xs flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span>Pending Challan</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-100 border-green-200 text-green-800 text-xs flex items-center gap-1">
                <span>No Pending Challans</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Display challan details if available from API */}
        {challanDetails && challanDetails.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-left">Challan Details</h3>
            <div className="space-y-2 border rounded-md p-3 bg-orange-50">
              {challanDetails.map((challan: any, index: number) => (
                <div key={index} className="border-b border-orange-200 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Challan No:</span>
                    <span>{challan.challan_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Amount:</span>
                    <span>₹{challan.amount || '0'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Status:</span>
                    <span className={challan.status === 'PAID' ? 'text-green-600' : 'text-red-600'}>
                      {challan.status || 'UNPAID'}
                    </span>
                  </div>
                  {challan.violation_date && (
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Date:</span>
                      <span>{new Date(challan.violation_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
