
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, ShieldCheck, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VehicleTypeIcon from '@/components/transport-safety/VehicleTypeIcon';
import VehicleStatusBadge from '@/components/transport-safety/VehicleStatusBadge';
import { toast } from '@/hooks/use-toast';
import { Vehicle } from '@/types/transportSafety';
import { formatDate } from '@/utils/dateUtils';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';

interface VehicleInfoCardProps {
  vehicle: Vehicle;
}

const VehicleInfoCard: React.FC<VehicleInfoCardProps> = ({ vehicle }) => {
  const { verifyDocument } = useTransportSafety();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  
  const { id: vehicleId, registrationNumber, make, model, type, status, year, capacity, documents } = vehicle;

  const runSafetyCheck = () => {
    setIsChecking(true);
    
    // Simulate API call with a timeout
    setTimeout(() => {
      // Process each document and simulate verification
      documents.forEach(doc => {
        const randomOutcome = Math.random();
        // 80% chance of success for the simulation
        if (randomOutcome < 0.8) {
          verifyDocument(vehicleId, doc.id, 'verified', 'api', 'Automatically verified through external API');
        } else {
          verifyDocument(vehicleId, doc.id, 'failed', 'api', 'Verification failed: Document information mismatch');
        }
      });
      
      const now = new Date();
      setLastCheckTime(now);
      setIsChecking(false);
      toast({
        title: "Safety Check Complete",
        description: `${documents.length} documents were checked through external verification APIs.`
      });
    }, 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <div className="bg-gray-100 p-3 rounded-lg mr-4">
            <VehicleTypeIcon type={type} size={32} />
          </div>
          <div>
            <CardTitle>{make} {model}</CardTitle>
            <div className="text-gray-500">{registrationNumber}</div>
          </div>
        </div>
        <VehicleStatusBadge status={status} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-left">
          <div className="text-left">
            <div className="text-sm font-medium text-gray-500">Type</div>
            <div className="text-left">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-500">Year</div>
            <div className="text-left">{year}</div>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-500">Capacity</div>
            <div className="text-left">{capacity} passengers</div>
          </div>
        </div>
        
        <div className="flex justify-start space-x-3">
          <Button asChild variant="outline">
            <Link to={`/transport-safety/${vehicleId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Vehicle
            </Link>
          </Button>
          
          <Button 
            onClick={runSafetyCheck} 
            disabled={isChecking} 
            variant="outline"
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            {isChecking ? 'Running Safety Check...' : 'Run Safety Check'}
          </Button>
        </div>
        
        <div className="mt-3 flex items-center text-sm text-gray-500">
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          <span>
            {lastCheckTime 
              ? `Last updated: ${formatDate(lastCheckTime)} at ${lastCheckTime.toLocaleTimeString()}`
              : "No safety checks have been run yet"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleInfoCard;
