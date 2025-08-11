
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import VehicleHeader from './VehicleHeader';
import VehicleInfoCard from './VehicleInfoCard';
import VehicleDocumentsCard from './VehicleDocumentsCard';
import VehicleTabs from './VehicleTabs';
import VehicleNotFound from './VehicleNotFound';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const VehicleDetailContent: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { getVehicle, loading, vehicles } = useTransportSafety();
  
  console.log("Vehicle ID from params:", vehicleId);
  console.log("Loading state:", loading);
  console.log("Vehicles count:", vehicles.length);
  
  const vehicle = getVehicle(vehicleId!);
  console.log("Found vehicle:", vehicle);

  // Show loading state while data is being fetched
  if (loading || vehicles.length === 0) {
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

  // Only show VehicleNotFound after loading is complete and vehicle is not found
  if (!vehicle) {
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
