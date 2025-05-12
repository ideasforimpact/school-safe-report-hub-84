
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vehicle } from '@/types/transportSafety';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/dateUtils';
import { Calendar, FileText, Flag, Info } from 'lucide-react';

interface VehicleInfoCardProps {
  vehicle?: Vehicle;
}

const VehicleInfoCard: React.FC<VehicleInfoCardProps> = ({ vehicle }) => {
  // Check if vehicle has challan records
  const getChallanDetails = () => {
    if (!vehicle || !vehicle.verificationData) return null;
    
    // Find challan_details in verification data
    const challanEntry = vehicle.verificationData.find(item => item.field === 'challan_details');
    if (!challanEntry || !challanEntry.value || !challanEntry.value.challan_details) return null;
    
    return challanEntry.value.challan_details.challans || [];
  };
  
  const challanRecords = getChallanDetails();
  
  if (!vehicle) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Vehicle Info Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No vehicle data available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Vehicle Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle Details */}
        <div className="space-y-3">
          <div className="flex justify-between px-4 py-2 bg-gray-50 rounded-md">
            <span className="text-gray-600">Registration Number:</span>
            <span className="font-medium">{vehicle.registrationNumber}</span>
          </div>
          
          <div className="flex justify-between px-4 py-2">
            <span className="text-gray-600">Make & Model:</span>
            <span className="font-medium">{vehicle.make} {vehicle.model}</span>
          </div>
          
          <div className="flex justify-between px-4 py-2 bg-gray-50 rounded-md">
            <span className="text-gray-600">Year:</span>
            <span className="font-medium">{vehicle.year}</span>
          </div>
          
          <div className="flex justify-between px-4 py-2">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium capitalize">{vehicle.type}</span>
          </div>
          
          <div className="flex justify-between px-4 py-2 bg-gray-50 rounded-md">
            <span className="text-gray-600">Driver:</span>
            <span className="font-medium">{vehicle.driver}</span>
          </div>
          
          <div className="flex justify-between px-4 py-2">
            <span className="text-gray-600">Route:</span>
            <span className="font-medium">{vehicle.route}</span>
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
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                    {challan.challan_date || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
            
            {challanRecords[0]?.successful_backends && (
              <div className="text-xs text-gray-500 flex items-start mt-2">
                <Info className="h-3 w-3 mr-1 mt-0.5" />
                <span>
                  Data sources: {challanRecords[0].successful_backends?.join(', ') || 'Unknown'}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleInfoCard;
