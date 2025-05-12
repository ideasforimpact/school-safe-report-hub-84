import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VehicleTypeIcon from '@/components/transport-safety/VehicleTypeIcon';
import VehicleStatusBadge from '@/components/transport-safety/VehicleStatusBadge';
import { toast } from 'sonner';
import { Vehicle } from '@/types/transportSafety';
import { formatDate } from '@/utils/dateUtils';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface VehicleInfoCardProps {
  vehicle: Vehicle;
}

const VehicleInfoCard: React.FC<VehicleInfoCardProps> = ({ vehicle }) => {
  const { verifyDocument, deleteVehicle, updateVehicle } = useTransportSafety();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(
    vehicle.verificationDate ? new Date(vehicle.verificationDate) : null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVerificationResults, setShowVerificationResults] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const navigate = useNavigate();
  
  const { id: vehicleId, registrationNumber, make, model, type, status, year, documents } = vehicle;

  const getLatestVerificationData = () => {
    if (!vehicle.verificationData) return null;
    
    const logEntry = vehicle.verificationData.find(item => item.field === 'verification_log');
    if (!logEntry || !logEntry.value) return null;

    // Get the latest verification date
    const dates = Object.keys(logEntry.value).sort().reverse();
    if (dates.length === 0) return null;
    
    // Return the data for the latest date
    return logEntry.value[dates[0]];
  };

  const runSafetyCheck = async () => {
    setIsChecking(true);
    
    try {
      // Call the Supabase Edge Function to verify the vehicle
      const { data, error } = await supabase.functions.invoke('vehicle-verify', {
        body: { registrationNumber, vehicleId }
      });
      
      if (error) {
        console.error('Error verifying vehicle:', error);
        toast.error('Vehicle verification failed');
        return;
      }
      
      // Update verification status in component state
      setVerificationData(data.data);
      setLastCheckTime(new Date());
      setShowVerificationResults(true);
      
      // Update the vehicle in context with verification data
      updateVehicle(vehicleId, {
        verificationStatus: data.data.status,
        verificationDate: data.data.verificationDate,
        verificationData: data.data.transformed
      });
      
      // Process documents if they exist
      documents.forEach(doc => {
        verifyDocument(vehicleId, doc.id, 'verified', 'api', 'Automatically verified through Surepass API');
      });
      
      toast.success('Vehicle verified successfully through Surepass');
    } catch (err) {
      console.error('Failed to verify vehicle:', err);
      toast.error('Verification failed. Please try again later.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleDeleteVehicle = () => {
    deleteVehicle(vehicleId);
    navigate('/transport-safety');
  };
  
  const formatVerificationData = (data: any) => {
    if (!data || !Array.isArray(data)) return [];
    
    // Filter out the verification_log, last_response, and status fields
    let finalResponse = data
      .filter((item: any) => item.field !== 'verification_log' && item.field !== 'last_response' && item.field !== 'status')
      .map((item: any) => ({
        label: item.field.replace(/_/g, ' ').split(' ').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value: item.value
      }));

     console.log(finalResponse)
    return finalResponse
  };

  // Get the latest verification data for display
  const latestVerificationData = getLatestVerificationData();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <div className="bg-gray-100 p-3 rounded-lg mr-4">
            <VehicleTypeIcon type={type} size={32} />
          </div>
          <div>
            <CardTitle>{make} {model}</CardTitle>
            <div className="text-gray-500 text-left">{registrationNumber}</div>
          </div>
        </div>
        <VehicleStatusBadge status={status} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6 text-left">
          <div className="text-left">
            <div className="text-sm font-medium text-gray-500">Type</div>
            <div className="text-left">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-500">Year</div>
            <div className="text-left">{year}</div>
          </div>
        </div>
        
        <div className="flex justify-start space-x-3">
          <Button 
            onClick={() => setShowDeleteConfirm(true)} 
            variant="outline"
            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Vehicle
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
        
        <div className="mt-3 flex items-center text-sm text-gray-500 text-left">
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          <span>
            {lastCheckTime 
              ? `Last verified: ${formatDate(lastCheckTime)} at ${lastCheckTime.toLocaleTimeString()}`
              : "No safety checks have been run yet"}
          </span>
        </div>
        
        {/* Display verification status if available */}
        {vehicle.verificationStatus && (
          <div className="mt-2 text-sm text-left">
            <span className="font-medium">Status:</span> 
            <span className={`ml-1 ${vehicle.verificationStatus === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
              {vehicle.verificationStatus.charAt(0).toUpperCase() + vehicle.verificationStatus.slice(1)}
            </span>
          </div>
        )}

        
        {/* Only show the "View Latest Verification" button */}
        {latestVerificationData && (
          <div className="mt-3">
            <Dialog open={showVerificationResults} onOpenChange={setShowVerificationResults}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  View Latest Verification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Vehicle Verification Results</DialogTitle>
                  <DialogDescription>
                    Registration details verified through Surepass API.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="border rounded-md divide-y overflow-y-auto">
                  {formatVerificationData(latestVerificationData).map((field: any, index: number) => (
                     
                    <div key={index} className="flex justify-between px-4 py-2">
                      <span className="font-medium text-gray-500">{field.label}:</span>
                      <span className="text-gray-900">{typeof field.value === 'object' ? JSON.stringify(field.value) : field.value}</span>
                    </div>
                  ))}
                </div>
                
                <DialogFooter>
                  <Button onClick={() => setShowVerificationResults(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the vehicle {make} {model} ({registrationNumber}) 
              and all of its associated documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVehicle} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default VehicleInfoCard;
