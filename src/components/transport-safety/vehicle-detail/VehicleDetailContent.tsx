
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import VehicleHeader from './VehicleHeader';
import VehicleInfoCard from './VehicleInfoCard';
import VehicleDocumentsCard from './VehicleDocumentsCard';
import VehicleTabs from './VehicleTabs';
import VehicleNotFound from './VehicleNotFound';

const VehicleDetailContent: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { getVehicle } = useTransportSafety();
  
  const vehicle = getVehicle(vehicleId!);

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
