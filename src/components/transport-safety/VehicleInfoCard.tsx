
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
      </CardContent>
    </Card>
  );
};

export default VehicleInfoCard;
