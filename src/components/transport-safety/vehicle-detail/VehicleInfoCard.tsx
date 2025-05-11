
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, Trash2, Clock, History } from 'lucide-react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

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
  const [showVerificationHistory, setShowVerificationHistory] = useState(false);
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
    if (!data || !data.transformed) return [];
    
    // Get only the fields we want to display (excluding verification_log which is used for history)
    return data.transformed
      .filter((item: any) => item.field !== 'verification_log' && item.field !== 'last_response' && item.field !== 'status')
      .map((item: any) => ({
        label: item.field.replace(/_/g, ' ').split(' ').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value: item.value
      }));
  };
  
  // Find verification log entry to get history
  const getVerificationLog = () => {
    if (!vehicle.verificationData) return null;
    
    const logEntry = vehicle.verificationData.find(item => item.field === 'verification_log');
    return logEntry?.value || null;
  };
  
  const verificationLog = getVerificationLog();
  
  // Get verification history entries sorted by date (newest first)
  const getVerificationHistory = () => {
    if (!verificationLog) return [];
    
    return Object.entries(verificationLog)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, data]) => ({
        date,
        data
      }));
  };
  
  const verificationHistory = getVerificationHistory();

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
        
        {/* Display verification actions for logs and history */}
        {verificationLog && (
          <div className="mt-3 flex space-x-2">
            <Dialog open={showVerificationResults} onOpenChange={setShowVerificationResults}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  View Latest Verification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Vehicle Verification Results</DialogTitle>
                  <DialogDescription>
                    Registration details verified through Surepass API.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="border rounded-md divide-y">
                  {formatVerificationData(verificationData || { transformed: vehicle.verificationData }).map((field: any, index: number) => (
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

            {verificationHistory.length > 1 && (
              <Dialog open={showVerificationHistory} onOpenChange={setShowVerificationHistory}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <History className="h-4 w-4 mr-2" />
                    View Verification History
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Verification History</DialogTitle>
                    <DialogDescription>
                      View past vehicle verification records.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="latest" className="w-full">
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="latest">Latest Record</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="latest" className="pt-2">
                      <div className="text-sm font-medium mb-2">
                        Latest verification: {verificationHistory[0].date}
                      </div>
                      <div className="border rounded-md divide-y">
                        {Array.isArray(verificationHistory[0].data) ? 
                          verificationHistory[0].data
                            .filter((item: any) => item.field !== 'verification_log' && item.field !== 'last_response' && item.field !== 'status')
                            .map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between px-4 py-2">
                                <span className="font-medium text-gray-500">
                                  {item.field.replace(/_/g, ' ').split(' ').map((word: string) => 
                                    word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                                </span>
                                <span className="text-gray-900">{typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value)}</span>
                              </div>
                            ))
                          : 
                          <div className="px-4 py-2 text-center text-gray-500">No details available</div>
                        }
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="history" className="pt-2">
                      <div className="space-y-4">
                        {verificationHistory.map((entry, idx) => (
                          <div key={idx} className="border rounded-md p-4">
                            <h4 className="font-medium mb-2">
                              {new Date(entry.date).toLocaleString()}
                            </h4>
                            <div className="text-xs text-gray-500 mb-2">
                              Verification status: <span className={
                                Array.isArray(entry.data) && 
                                entry.data.find((i: any) => i.field === 'status')?.value === 'active' ? 
                                'text-green-600' : 'text-amber-600'
                              }>
                                {Array.isArray(entry.data) ? 
                                  String(entry.data.find((i: any) => i.field === 'status')?.value || 'Unknown').toUpperCase() : 
                                  'Unknown'
                                }
                              </span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => {
                                // Set the selected history entry as the current verification data
                                setVerificationData({ transformed: entry.data });
                                setShowVerificationHistory(false);
                                setShowVerificationResults(true);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <DialogFooter>
                    <Button onClick={() => setShowVerificationHistory(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
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
