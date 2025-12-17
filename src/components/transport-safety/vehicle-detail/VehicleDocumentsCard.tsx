
import React, { useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VehicleDocumentsCardProps {
  vehicle: Vehicle;
}

const VehicleDocumentsCard: React.FC<VehicleDocumentsCardProps> = ({ vehicle }) => {
  const { id: vehicleId, documents } = vehicle;
  
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
  
  // Check for challan details in verification data
  const hasChallanFromApi = () => {
    if (!hasVerificationData) return false;
    
    // Find the verification_log entry
    const logEntry = vehicle.verificationData.find(item => item.field === 'verification_log');
    if (!logEntry || !logEntry.value) return false;
    
    // Get the latest verification log
    const latestLog = getLatestVerificationLog(vehicle);
    if (!latestLog) return false;
    
    // Find challan_details in the latest log
    const challanDetails = latestLog.find(item => item.field === 'challan_details');
    if (challanDetails && challanDetails.value && 
        challanDetails.value.challan_details && 
        challanDetails.value.challan_details.challans && 
        challanDetails.value.challan_details.challans.length > 0 && challanDetails.value.challan_details.challans.some(
        c => c.challan_status?.toLowerCase() === "pending")) {
      return true;
    }
    
    return false;
  };
  
  // Get the latest challan data from verification log
  const getChallanDetails = () => {
    if (!hasVerificationData) return [];
    
    // Get the latest verification log
    const latestLog = getLatestVerificationLog(vehicle);
    if (!latestLog) return [];
    
    // Find challan_details in the latest log
    const challanDetails = latestLog.find(item => item.field === 'challan_details');
    if (challanDetails && challanDetails.value && challanDetails.value.challan_details) {
      return challanDetails.value.challan_details.challans || [];
    }
    
    return [];
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
  const [showAllChallans, setShowAllChallans] = useState(false);

  console.log(challanDetails,"challanDetails");
  

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
            {hasVerificationData ? (
              hasChallan() ? (
                <Badge variant="outline" className="bg-orange-100 border-orange-200 text-orange-800 text-xs flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span>Pending Challan</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-100 border-green-200 text-green-800 text-xs flex items-center gap-1">
                  <span>No Pending Challans</span>
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="bg-gray-100 border-gray-200 text-gray-800 text-xs flex items-center gap-1">
                <span>Not Available</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Display challan details if available from API */}
        {challanDetails && challanDetails.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-left">Challan Details</h3>
            <div className="space-y-2 border rounded-md p-3 bg-orange-50">
              {(challanDetails.slice(0, 1) ?? []).map((challan: any, index: number)  => (
                <div key={index} className="border-b border-orange-200 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Challan No:</span>
                    <span className="text-gray-900">{challan.challan_no || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Amount:</span>
                    <span>₹{challan.amount || challan.challan_amount || '0'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Status:</span>
                    <span className={challan.challan_status?.toUpperCase() === 'DISPOSED' || challan.challan_status?.toUpperCase() === 'PAID' ? 'text-green-600' : 'text-red-600'}>
                      {challan.challan_status || 'UNPAID'}
                    </span>
                  </div>
                  {(challan.Info || challan.challan_info) && (
                    <div className="flex justify-between text-xs mt-1">
                      <span className="font-medium">Info:</span>
                      <span className="text-gray-700">{challan.Info || challan.challan_info}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* View More Button */}
            {challanDetails.length > 1 && (
              <button
                onClick={() => setShowAllChallans(true)}
                className="text-blue-600 text-xs mt-2 underline"
              >
                View More
              </button>
            )}
          </div>
        )}
        
        <Dialog open={showAllChallans} onOpenChange={setShowAllChallans}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>All Challans</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {(challanDetails || []).map((challan: any, index: number) => (
                <div key={index} className="border rounded-md p-3 bg-orange-50">

                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Challan No:</span>
                    <span>{challan.challan_number || challan.challan_no || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Amount:</span>
                    <span>₹{challan.amount || challan.challan_amount || "0"}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className={challan.challan_status?.toUpperCase() === "PAID" ||
                      challan.challan_status?.toUpperCase() === "DISPOSED"
                      ? "text-green-600"
                      : "text-red-600"}>
                      {challan.challan_status || "UNPAID"}
                    </span>
                  </div>

                  {(challan.Info || challan.challan_info) && (
                    <div className="flex justify-between text-xs mt-1">
                      <span className="font-medium">Info:</span>
                      <span>{challan.Info || challan.challan_info}</span>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

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
