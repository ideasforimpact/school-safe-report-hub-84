
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import { getVehicleById } from '@/services/transport-safety/vehicleService';
import { Vehicle } from '@/types/transportSafety';
import VehicleHeader from './VehicleHeader';
import VehicleInfoCard from './VehicleInfoCard';
import VehicleDocumentsCard from './VehicleDocumentsCard';
import VehicleTabs from './VehicleTabs';
import VehicleNotFound from './VehicleNotFound';
import { Loader2 } from 'lucide-react';

const VehicleDetailContent: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { user, employeeData } = useAuth();
  const { getVehicle: getVehicleFromContext, vehicles: contextVehicles } = useTransportSafety();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;

  // Fetch vehicle from database
  const fetchVehicle = async () => {
    if (!vehicleId || !clientId) {
      setLoading(false);
      setError('Missing vehicle ID or client ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch vehicle directly from database with client_id validation
      // This ensures that vehicles from other clients cannot be accessed
      const fetchedVehicle = await getVehicleById(vehicleId, clientId);
      
      if (!fetchedVehicle) {
        setError('Vehicle not found or you do not have access to this vehicle');
        setVehicle(null);
      } else {
        // Double-check that the vehicle belongs to the current client
        if (fetchedVehicle.clientId !== clientId) {
          setError('You do not have access to this vehicle');
          setVehicle(null);
        } else {
          setVehicle(fetchedVehicle);
        }
      }
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      setError('Failed to load vehicle details');
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchVehicle();
  }, [vehicleId, clientId]);

  // Listen to context updates (from realtime subscription or manual updates)
  // This ensures the component updates when vehicle is updated via safety check
  useEffect(() => {
    if (vehicleId && clientId && contextVehicles.length > 0) {
      const contextVehicle = getVehicleFromContext(vehicleId);
      if (contextVehicle && contextVehicle.clientId === clientId) {
        // Update local state with context vehicle (which has latest data from realtime)
        // This will trigger when the vehicle is updated in the context after safety check
        setVehicle(contextVehicle);
      }
    }
  }, [vehicleId, clientId, contextVehicles, getVehicleFromContext]);

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <VehicleHeader />
        
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading vehicle details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error or not found state
  if (error || !vehicle) {
    return <VehicleNotFound />;
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <VehicleHeader />

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="w-full md:w-2/3">
          <VehicleInfoCard vehicle={vehicle} />
        </div>

        <div className="w-full md:w-1/3">
          <VehicleDocumentsCard vehicle={vehicle} />
        </div>
      </div>

      <VehicleTabs vehicleId={vehicleId!} />
    </div>
  );
};

export default VehicleDetailContent;
