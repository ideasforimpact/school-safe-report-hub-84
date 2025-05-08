
import React from 'react';
import { Bus, BarChart2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TransportSafetyProvider } from '@/contexts/transport-safety/TransportSafetyContext';
import VehiclesList from '@/components/transport-safety/VehiclesList';

const TransportSafetyPage = () => {
  return (
    <Layout>
      <TransportSafetyProvider>
        <div className="container mx-auto py-6 max-w-7xl">
          <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-4">
              <Bus className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-left">Transport Safety</h1>
                <p className="text-gray-500 text-sm">Manage and verify school transport vehicles and documentation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="flex items-center gap-2">
                <Link to="/transport-safety/dashboard">
                  <BarChart2 className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-medium mb-4 text-left">Vehicle Fleet</h2>
            <VehiclesList />
          </div>
        </div>
      </TransportSafetyProvider>
    </Layout>
  );
};

export default TransportSafetyPage;
