
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, Trash2 } from 'lucide-react';
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
        verificationStatus: 'verified',
        verificationDate: new Date().toISOString(),
        verificationData: data.data
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
    if (!data) return [];
    
    // Extract useful information from the Surepass response
    const fields = [
      { label: 'Registration Number', value: data.result?.registration_number || 'N/A' },
      { label: 'Owner Name', value: data.result?.owner_name || 'N/A' },
      { label: 'Vehicle Class', value: data.result?.vehicle_class || 'N/A' },
      { label: 'Manufacturer', value: data.result?.manufacturer || 'N/A' },
      { label: 'Model', value: data.result?.model || 'N/A' },
      { label: 'Fuel Type', value: data.result?.fuel_type || 'N/A' },
      { label: 'Registration Date', value: data.result?.registration_date || 'N/A' },
      { label: 'Fitness Upto', value: data.result?.fitness_upto || 'N/A' },
      { label: 'Insurance Upto', value: data.result?.insurance_upto || 'N/A' },
    ];
    
    return fields;
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
      
      {/* Verification results dialog */}
      <Dialog open={showVerificationResults} onOpenChange={setShowVerificationResults}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vehicle Verification Results</DialogTitle>
            <DialogDescription>
              Registration details verified through Surepass API.
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md divide-y">
            {formatVerificationData(verificationData).map((field, index) => (
              <div key={index} className="flex justify-between px-4 py-2">
                <span className="font-medium text-gray-500">{field.label}:</span>
                <span className="text-gray-900">{field.value}</span>
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
    </Card>
  );
};

export default VehicleInfoCard;
