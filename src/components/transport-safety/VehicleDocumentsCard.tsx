
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vehicle } from '@/types/transportSafety';
import { Badge } from '@/components/ui/badge';
import { FileText, Flag } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

interface VehicleDocumentsCardProps {
  vehicle: Vehicle;
}

const VehicleDocumentsCard: React.FC<VehicleDocumentsCardProps> = ({ vehicle }) => {
  // Check if vehicle has challan records
  const getChallanDetails = () => {
    if (!vehicle.verificationData) return null;
    
    // Find challan_details in verification data
    const challanEntry = vehicle.verificationData.find(item => item.field === 'challan_details');
    if (!challanEntry || !challanEntry.value || !challanEntry.value.challan_details) return null;
    
    return challanEntry.value.challan_details.challans || [];
  };
  
  const challanRecords = getChallanDetails();
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Vehicle Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Insurance Document */}
          <div className="p-3 border rounded-md">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Insurance</h3>
                <p className="text-sm text-gray-500">
                  {vehicle.documents.find(doc => doc.type === 'insurance')?.expiryDate 
                    ? `Expires: ${formatDate(new Date(vehicle.documents.find(doc => doc.type === 'insurance')?.expiryDate || ''))}`
                    : 'Expiry date not available'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Fitness Certificate */}
          <div className="p-3 border rounded-md">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Fitness Certificate</h3>
                <p className="text-sm text-gray-500">
                  {vehicle.documents.find(doc => doc.type === 'fitness')?.expiryDate 
                    ? `Expires: ${formatDate(new Date(vehicle.documents.find(doc => doc.type === 'fitness')?.expiryDate || ''))}`
                    : 'Expiry date not available'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Pollution Certificate */}
          <div className="p-3 border rounded-md">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Pollution Certificate</h3>
                <p className="text-sm text-gray-500">
                  {vehicle.documents.find(doc => doc.type === 'pollution')?.expiryDate 
                    ? `Expires: ${formatDate(new Date(vehicle.documents.find(doc => doc.type === 'pollution')?.expiryDate || ''))}`
                    : 'Expiry date not available'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Challan Records */}
          {challanRecords && challanRecords.length > 0 && (
            <div className="p-3 border border-orange-200 rounded-md bg-orange-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Flag className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium">Challan Records</h3>
                  <p className="text-sm text-gray-500">
                    {challanRecords.length} record{challanRecords.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 mt-3">
                {challanRecords.map((challan: any, index: number) => (
                  <div key={index} className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm p-2 bg-white rounded border border-orange-100">
                    <span className="font-medium">Number:</span>
                    <span>{challan.challan_number || 'N/A'}</span>
                    
                    <span className="font-medium">Amount:</span>
                    <span>₹{challan.amount || '0'}</span>
                    
                    <span className="font-medium">Status:</span>
                    <span>
                      <Badge 
                        className={
                          challan.challan_status?.toUpperCase() === 'DISPOSED' || 
                          challan.challan_status?.toUpperCase() === 'PAID' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : 'bg-red-100 text-red-800 hover:bg-red-100'
                        }
                      >
                        {challan.challan_status || 'UNPAID'}
                      </Badge>
                    </span>
                    
                    <span className="font-medium">Date:</span>
                    <span>{challan.challan_date || 'N/A'}</span>
                    
                    {(challan.Info || challan.challan_info) && (
                      <>
                        <span className="font-medium">Info:</span>
                        <span className="text-gray-700">{challan.Info || challan.challan_info}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleDocumentsCard;
