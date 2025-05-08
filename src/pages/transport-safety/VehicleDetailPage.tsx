
import React from 'react';
import Layout from '@/components/layout/Layout';
import { TransportSafetyProvider } from '@/contexts/transport-safety/TransportSafetyContext';
import VehicleDetailContent from '@/components/transport-safety/vehicle-detail/VehicleDetailContent';

const VehicleDetailPage: React.FC = () => {
  return (
    <Layout>
      <TransportSafetyProvider>
        <VehicleDetailContent />
      </TransportSafetyProvider>
    </Layout>
  );
};

export default VehicleDetailPage;
