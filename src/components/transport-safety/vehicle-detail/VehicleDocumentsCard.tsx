
import React from 'react';
import { FileX, FileCheck, ShieldAlert } from 'lucide-react';
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
  
  const hasChallan = () => {
    // Check for any specific notes or properties that indicate a challan
    return documents.some(doc => 
      doc.notes?.toLowerCase().includes('challan') || 
      doc.issuedBy?.toLowerCase().includes('police') ||
      doc.provider?.toLowerCase().includes('police')
    );
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
                <span>Pending Challan</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-100 border-green-200 text-green-800 text-xs flex items-center gap-1">
                <span>No Pending Challans</span>
              </Badge>
            )}
          </div>
        </div>

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
