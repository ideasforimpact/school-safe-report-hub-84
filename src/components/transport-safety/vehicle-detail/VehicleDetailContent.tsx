
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { getVehicleById } from '@/services/transport-safety/vehicleService';
import { Vehicle } from '@/types/transportSafety';
import VehicleHeader from './VehicleHeader';
import VehicleInfoCard from './VehicleInfoCard';
import VehicleDocumentsCard from './VehicleDocumentsCard';
import VehicleTabs from './VehicleTabs';
import VehicleNotFound from './VehicleNotFound';
import Loader from '@/components/common/Loader';

const VehicleDetailContent: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { user, employeeData } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientId = employeeData?.clientId || user?.clientId;

  useEffect(() => {
    if (!vehicleId || !clientId) {
      setLoading(false);
      setError('Missing vehicle ID or client ID');
      return;
    }

    let cancelled = false;

    const fetchVehicle = async () => {
      try {
        setLoading(true);
        setError(null);

        const fetchedVehicle = await getVehicleById(vehicleId, clientId);

        if (cancelled) return;

        if (!fetchedVehicle || fetchedVehicle.clientId !== clientId) {
          setError('Vehicle not found or you do not have access to this vehicle');
          setVehicle(null);
        } else {
          setVehicle(fetchedVehicle);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching vehicle:', err);
        setError('Failed to load vehicle details');
        setVehicle(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVehicle();

    return () => { cancelled = true; };
  }, [vehicleId, clientId]);

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <VehicleHeader />

        
          <Loader text="Loading vehicle details..." />
        
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

      <VehicleTabs vehicleId={vehicleId!} vehicle={vehicle} />
    </div>
  );
};

export default VehicleDetailContent;
