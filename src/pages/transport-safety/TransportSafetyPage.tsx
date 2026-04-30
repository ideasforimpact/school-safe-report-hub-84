import React, { useState, useCallback } from 'react';
import { Plus, ExternalLink, Car } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import VehiclesList from '@/components/transport-safety/VehiclesList';
import AddVehicleDialog from '@/components/transport-safety/AddVehicleDialog';
import { useAuth } from '@/contexts';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';
import {
  getPendingChallansFromVehicleChallans,
} from '@/services/transport-safety/vehicleService';

const TransportSafetyPage = () => {
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingChallanCount, setPendingChallanCount] = useState(0);

  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  const navigate = useNavigate();
  

const handleVehiclesChanged = useCallback(({ vehicles }) => {
  setTotalVehicles(vehicles.length);
  
  // Recalculate pending challans from vehicle_challans
  let totalPendingAmount = 0;
  let totalPendingCount = 0;
  
  vehicles.forEach(vehicle => {
    const pending = getPendingChallansFromVehicleChallans(vehicle.vehicleChallans || null);
    totalPendingCount += pending.length;
    totalPendingAmount += pending.reduce((sum, c) => {
      const amount = Number(c.amount || c.challan_amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  });
  
  setPendingAmount(totalPendingAmount);
  setPendingChallanCount(totalPendingCount);
  console.log({vehicles,totalPendingAmount,totalPendingCount},'happens with the vehicle');

}, []);



  return (
    <Layout>
      <div className="w-full py-6">
        <div className="mx-6 mb-8 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <Car className="h-6 w-6 text-primary" />
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Pending Challan</p>
                      {pendingChallanCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-orange-500 rounded-full">
                          {pendingChallanCount}
                        </span>
                      )}
                    </div>
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
            {!isReadOnlySwitchedContext && (
              <Button
                onClick={() => setShowAddVehicle(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Vehicle</span>
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
          <VehiclesList showAddVehicle={showAddVehicle} setShowAddVehicle={setShowAddVehicle}  onVehiclesChanged={handleVehiclesChanged} />
        </div>
      </div>

      {/* Add Vehicle Dialog */}
      <AddVehicleDialog
        open={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
      />
    </Layout>
  );
};

export default TransportSafetyPage;
