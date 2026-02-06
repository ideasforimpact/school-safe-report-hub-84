import React, { useState, useEffect } from 'react';
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
import { useEmployeeStore } from '@/store/EmployeeContext';
import { hasModulePermission, isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import {
  AlertDialog,
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
import { Badge } from '@/components/ui/badge';
import { getLatestVerificationFieldValue } from '@/utils/transport-safety/documentStatusUtils';
import VerificationDetailsDialog from '../VerificationDetailsDialog';
import { getVehicleChallans } from '@/services/transport-safety/vehicleService';
import { VehicleChallans } from '@/types/transportSafety';

interface VehicleInfoCardProps {
  vehicle: Vehicle;
}

const VehicleInfoCard: React.FC<VehicleInfoCardProps> = ({ vehicle }) => {
  const { verifyDocument, deleteVehicle, updateVehicle } = useTransportSafety();
  const { state } = useEmployeeStore();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(
    vehicle.verificationDate ? new Date(vehicle.verificationDate) : null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVerificationResults, setShowVerificationResults] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [apiResponseData, setApiResponseData] = useState<any>(null);
  const [showSafetyCheckConsent, setShowSafetyCheckConsent] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [challanError, setChallanError] = useState<string | null>(null);
  const [hasChallanData, setHasChallanData] = useState<boolean>(true);
  const [vehicleChallans, setVehicleChallans] = useState<VehicleChallans | null>(null);

  
  const { id: vehicleId, registrationNumber, make, model, type, status, year, documents } = vehicle;

  // Check if user has admin access to transport safety module
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  const hasTransportSafetyAccess = hasModulePermission(state, 'transportSafetyAdmin');
  
  // Check if user has admin access level for transport safety
  const hasAdminAccess = React.useMemo(() => {
    if (isSuperAdmin) return true;
    
    // Check configured modules for transport safety admin access
    const transportSafetyModule = state.configuredModules?.find(
      module => module.key === 'transportSafetyAdmin' || module.name.toLowerCase().includes('transport safety')
    );
    
    if (transportSafetyModule?.accessLevel) {
      // Check for different possible admin flag formats
      return transportSafetyModule.accessLevel.isAdmin === true || 
             transportSafetyModule.accessLevel.is_admin === true;
    }
    
    return false;
  }, [isSuperAdmin, state.configuredModules]);

  // Fetch vehicle_challans when component mounts
  useEffect(() => {
    const fetchVehicleChallans = async () => {
      if (vehicleId) {
        try {
          const challans = await getVehicleChallans(vehicleId);
          setVehicleChallans(challans);
        } catch (error) {
          console.error('Error fetching vehicle_challans:', error);
        }
      }
    };

    fetchVehicleChallans();
  }, [vehicleId]);

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



  const handleSafetyCheckClick = () => {
    setVerificationError(null); // Clear any previous errors
    setShowSafetyCheckConsent(true);
  };

  const handleSafetyCheckConsent = async () => {
    // Don't close popup immediately, keep it open for loading state
    setIsChecking(true);
    
    try {
      // Call the Supabase Edge Function to verify the vehicle
      const { data, error } = await supabase.functions.invoke('vehicle-verify', {
        body: { registrationNumber, vehicleId }
      });
      
      if (error) {
        console.error('Error verifying vehicle:', error);
        // Show error in popup instead of toast
        setVerificationError('Vehicle verification failed. Please try again.');
        return;
      }
      
      // Update verification status in component state
      setVerificationData(data.data);
      setApiResponseData(data.data); // Store API response for dialog
      setLastCheckTime(new Date());
      
      // Update the vehicle in context with verification data (minimal update)
      updateVehicle(vehicleId, {
        verificationStatus: data.data.status,
        verificationDate: data.data.verificationDate,
        verificationData: data.data.transformed
      });

      // Refresh vehicle_challans after API call (challan data is stored in vehicle_challans table)
      try {
        const updatedChallans = await getVehicleChallans(vehicleId);
        setVehicleChallans(updatedChallans);
        
        // Check challan status from vehicle_challans
        if (updatedChallans) {
          // Check if we have challan data (even if API call failed, we might have error data)
          if (updatedChallans.latest_challan_data) {
            // Check if the data contains actual challans or is an error response
            const challanData = updatedChallans.latest_challan_data;
            const hasChallans = 
              (challanData?.data?.challan_details?.challans && Array.isArray(challanData.data.challan_details.challans) && challanData.data.challan_details.challans.length > 0) ||
              (challanData?.data?.challan_data && Array.isArray(challanData.data.challan_data) && challanData.data.challan_data.length > 0) ||
              (challanData?.challan_details?.challans && Array.isArray(challanData.challan_details.challans) && challanData.challan_details.challans.length > 0);
            
            if (hasChallans) {
              setChallanError(null);
              setHasChallanData(true);
            } else if (updatedChallans.challan_status === false) {
              // API call failed, but we have error data
              setChallanError(null);
              setHasChallanData(false);
            } else {
              // Data exists but no challans found (might be empty response)
              setChallanError(null);
              setHasChallanData(false);
            }
          } else {
            // No challan data at all
            setChallanError(null);
            setHasChallanData(false);
          }
        } else {
          // No challan record found (API might not have been called yet or failed completely)
          setChallanError(null);
          setHasChallanData(false);
        }
      } catch (challanFetchError) {
        console.error('Error fetching vehicle_challans after API call:', challanFetchError);
        setChallanError('Failed to fetch challan details. Please try again.');
        setHasChallanData(false);
      }
      
      // Process documents if they exist
      documents.forEach(doc => {
        verifyDocument(vehicleId, doc.id, 'verified', 'api', 'Automatically verified through Surepass API');
      });
      
      // Open verification dialog with API response data
      setShowVerificationResults(true);
      
      // Close popup only after successful response
      setShowSafetyCheckConsent(false);
      // toast.success('Vehicle verified successfully through Surepass');
    } catch (err) {
      console.error('Failed to verify vehicle:', err);
      // Show error in popup instead of toast
      setVerificationError('Verification failed. Please try again later.');
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
    
    // Filter out the verification_log, last_response, status, challan_details, client identifiers,
    // and noisy metadata like response_metadata or less_info
    let finalResponse = data
      .filter((item: any) => {
        const fieldName = item.field.toLowerCase();
        return fieldName !== 'verification_log' && 
               fieldName !== 'last_response' && 
               fieldName !== 'status' && 
               fieldName !== 'challan_details' &&
               fieldName !== 'client_id' &&
               fieldName !== 'clientid' &&
               !fieldName.includes('client id') &&
               !fieldName.includes('client_id') &&
               !fieldName.includes('client') &&
               fieldName !== 'response_metadata' &&
               !fieldName.includes('response metadata') &&
               fieldName !== 'less_info' &&
               !fieldName.includes('less info');
      })
      .map((item: any) => ({
        label: item.field.replace(/_/g, ' ').split(' ').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value: item.value
      }));

    return finalResponse;
  };

  // Get the latest verification data for display
  const latestVerificationData = getLatestVerificationData();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <div className="bg-gray-100 p-3 rounded-lg mr-4">
            <VehicleTypeIcon type={type} icon={vehicle.vehicleTypeIcon} size={32} />
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
            <div className="text-sm font-medium text-gray-500">Model</div>
            <div className="text-left">{model || (getLatestVerificationFieldValue(vehicle, 'maker_model') as string) || '-'}</div>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-500">Registration Year</div>
            <div className="text-left">{(() => {
              if (year) return year;
              const regDate = getLatestVerificationFieldValue(vehicle, 'registration_date') as string | undefined;
              if (!regDate) return '-';
              const match = String(regDate).match(/^\d{4}/);
              const yr = match ? Number(match[0]) : new Date(regDate).getFullYear();
              return yr || '-';
            })()}</div>
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
          
          {/* Only show Run Safety Check button if user has admin access */}
          {hasAdminAccess && (
            <Button 
              onClick={handleSafetyCheckClick} 
              disabled={isChecking} 
              variant="outline"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {isChecking ? 'Running Safety Check...' : 'Run Safety Check'}
            </Button>
          )}
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
              <VerificationDetailsDialog
                 open={showVerificationResults}
                  onOpenChange={setShowVerificationResults}
                  verificationData={latestVerificationData}
                  challanError={challanError}
                  hasChallanData={hasChallanData}
                  title="Latest Verification Details"
                  vehicle={vehicle}
                  apiResponse={apiResponseData}
                  vehicleChallans={vehicleChallans}
              />
            </Dialog>
          </div>
        )}
      </CardContent>

      {/* Safety Check Consent Dialog */}
      <AlertDialog open={showSafetyCheckConsent} onOpenChange={(open) => {
        // Only allow closing if not currently checking
        if (!isChecking) {
          setShowSafetyCheckConsent(open);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run Safety Check</AlertDialogTitle>
            <AlertDialogDescription>
              {!isChecking && !verificationError && (
                <>
                  This will initiate a comprehensive safety verification for {make} {model} ({registrationNumber}) 
                  through our secure verification system. The process will check vehicle registration, 
                  insurance status, fitness certificate, and pollution control compliance.
                  <br /><br />
                  This action will use external verification services and may take a few moments to complete.
                  Do you want to proceed with the safety check?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isChecking && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
              <span>Running safety check... Please wait.</span>
            </div>
          )}
          {verificationError && (
            <div className="text-red-600 bg-red-50 p-3 rounded-md">
              <strong>Error:</strong> {verificationError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChecking}>Cancel</AlertDialogCancel>
            {!isChecking && !verificationError && (
              <Button 
                onClick={handleSafetyCheckConsent} 
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Okay
              </Button>
            )}
            {verificationError && (
              <Button onClick={() => setShowSafetyCheckConsent(false)} className="bg-gray-600 hover:bg-gray-700 text-white">
                Close
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Vehicle
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 font-medium mb-2">
                  Warning: This action cannot be undone!
                </p>
                <p className="text-red-700 text-sm">
                  You are about to permanently delete the vehicle <strong>{make} {model}</strong> 
                  with registration number <strong>{registrationNumber}</strong>.
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-yellow-800 font-medium mb-2">
                  The following will be deleted:
                </p>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Vehicle information and details</li>
                  <li>• All associated documents and files</li>
                  <li>• Verification history and safety check data</li>
                  <li>• Any related incident reports</li>
                </ul>
              </div>
              
              <p className="text-gray-600 text-sm">
                Please confirm that you want to proceed with this deletion. 
                This action will immediately remove all data associated with this vehicle.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <Button 
              onClick={handleDeleteVehicle} 
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Yes, Delete Vehicle
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default VehicleInfoCard;
