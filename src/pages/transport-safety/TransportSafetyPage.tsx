import React, { useEffect, useState, useCallback } from 'react';
import { Bus, Plus, ExternalLink } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import VehiclesList from '@/components/transport-safety/VehiclesList';
import AddVehicleDialog from '@/components/transport-safety/AddVehicleDialog';
import { useAuth } from '@/contexts';
import {
  getAllVehicles,
  getPendingChallans,
} from '@/services/transport-safety/vehicleService';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';

const TransportSafetyPage = () => {
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);

  const { employeeData } = useAuth();
  const navigate = useNavigate();
  const clientId = employeeData?.clientId;

  const fetchStats = useCallback(async () => {
    console.log(clientId,'clientID for vehicle');
    
    if (!clientId) return;

    const vehicles = await getAllVehicles(clientId);
    console.log(vehicles,'total pending vehicle count');

    setTotalVehicles(vehicles.length);

    const totalPending = vehicles.reduce((sum, vehicle) => {
      const pending = getPendingChallans(vehicle.verificationData ?? []);
      return (
        sum +
        pending.reduce((s, c) => {
          const amount = Number(c.amount || c.challan_amount || 0);
          return s + (isNaN(amount) ? 0 : amount);
        }, 0)
      );
    }, 0);
    console.log(totalPending,'totalPending');
    
    setPendingAmount(totalPending);
  }, [clientId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

const handleVehicleRealtime = useCallback((payload: any) => {
  fetchStats();
}, [fetchStats]);


  useRealTimeSubHook({
    channelName: `vehicles-${clientId}`,
    table: 'vehicles',
    events: '*',
    enabled: true,
    onPayload: handleVehicleRealtime,
  });

  return (
    <Layout>
      <div className="w-full py-6">
        <div className="mx-6 mb-8 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <Bus className="h-6 w-6 text-primary" />
              </div>

              <div>
                <h1 className="text-2xl font-bold">Transport Safety</h1>
                <p className="text-gray-500 text-sm">
                  Manage and verify school transport vehicles and documentation
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-44">
                  <div>
                    <p className="text-sm text-gray-500">Total Vehicles</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      {totalVehicles}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Pending Challan</p>
                    <p className="text-3xl font-semibold text-orange-600">
                      ₹{pendingAmount.toLocaleString('en-IN')}
                    </p>

                    <button
                      onClick={() => navigate('/transport-safety/challans')}
                      className="mt-2 inline-flex items-center gap-1 text-sm text-orange-600 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View all pending challans →
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
          <VehiclesList showAddVehicle={showAddVehicle} setShowAddVehicle={setShowAddVehicle}  onVehiclesChanged={fetchStats} />
        </div>
      </div>

      {/* Add Vehicle Dialog */}
      <AddVehicleDialog
        open={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
        onSuccess={fetchStats}
      />
    </Layout>
  );
};

export default TransportSafetyPage;
