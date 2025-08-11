
import React, { useState } from 'react';
import { Bus, Plus } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TransportSafetyProvider } from '@/contexts/transport-safety/TransportSafetyContext';
import VehiclesList from '@/components/transport-safety/VehiclesList';
import AddVehicleDialog from '@/components/transport-safety/AddVehicleDialog';

const TransportSafetyPage = () => {
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  
  return (
    <Layout>
      <TransportSafetyProvider>
        <div className="w-full py-6">
          <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100 mx-6">
            <div className="flex items-center space-x-4">
              <Bus className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-left">Transport Safety</h1>
                <p className="text-gray-500 text-sm">Manage and verify school transport vehicles and documentation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowAddVehicle(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Vehicle</span>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
            <VehiclesList showAddVehicle={showAddVehicle} setShowAddVehicle={setShowAddVehicle} />
          </div>
        </div>
        
        {/* Add Vehicle Dialog */}
        <AddVehicleDialog 
          open={showAddVehicle} 
          onClose={() => setShowAddVehicle(false)} 
        />
      </TransportSafetyProvider>
    </Layout>
  );
};

export default TransportSafetyPage;
