import React from 'react';
import Layout from '@/components/layout/Layout';
import { Car } from 'lucide-react';

const TrustedVehiclesPage = () => {
  return (
    <Layout>
      <div className="w-full py-6">
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100 mx-6">
          <div className="flex items-center space-x-4">
            <Car className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-left">Trusted Vehicles</h1>
              <p className="text-gray-500 text-sm text-left">Manage trusted vehicles for visitors</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No Trusted Vehicles</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TrustedVehiclesPage;

