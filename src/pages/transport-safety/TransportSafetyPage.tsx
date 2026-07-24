import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, Car } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import VehiclesList from '@/components/transport-safety/VehiclesList';
import AddVehicleDialog from '@/components/transport-safety/AddVehicleDialog';
import { useAuth } from '@/contexts';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';
import {
  getAllVehiclesWithChallans,
  getPendingChallansFromVehicleChallans,
} from '@/services/transport-safety/vehicleService';
import Loader from '@/components/common/Loader';

const TransportSafetyPage = () => {
  const { employeeData } = useAuth();
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingChallanCount, setPendingChallanCount] = useState(0);
  const [pendingChallansLoaded, setPendingChallansLoaded] = useState(false);

  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  const navigate = useNavigate();

  // Read the vehicle count straight from the shared context — the single
  // source of truth that VehiclesList itself reads from — instead of
  // learning it through VehiclesList's onVehiclesChanged callback. That
  // indirection was the root cause of the double-loading bug: totalVehicles
  // started at 0 and only got updated asynchronously once, so any effect
  // keyed on it (see below) necessarily ran twice — once against the stale
  // 0, once against the real count.
  const {
    totalCount: totalVehicles,
    hasFetched: vehiclesHasFetched,
    loading: vehiclesLoading,
  } = useTransportSafety();

  // Pending challan totals must reflect every vehicle, not just the current
  // page of VehiclesList, so they're computed from a separate, unpaginated
  // fetch. Keyed ONLY on clientId — never on vehicle count/pagination state —
  // so this can only ever run once per page visit, never re-triggered by
  // VehiclesList settling or changing pages.
  useEffect(() => {
    if (!employeeData?.clientId) {
      // No client context yet (e.g. auth still resolving). Nothing to
      // compute, but we still need to resolve the loading gate below so the
      // page doesn't spin forever.
      setPendingChallansLoaded(true);
      return;
    }

    let cancelled = false;

    const loadPendingChallans = async () => {
      try {
        const vehicles = await getAllVehiclesWithChallans(employeeData.clientId);
        if (cancelled) return;

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
      } catch (error) {
        console.error('Failed to load pending challans:', error);
      } finally {
        if (!cancelled) setPendingChallansLoaded(true);
      }
    };

    loadPendingChallans();

    return () => {
      cancelled = true;
    };
  }, [employeeData?.clientId]);

  // The page's first paint waits on BOTH data sources before rendering
  // anything — vehicles (context: hasFetched) and pending challans
  // (pendingChallansLoaded). `!vehiclesLoading` is included alongside
  // hasFetched to cover the edge case where there's no clientId at all —
  // TransportSafetyContext skips the fetch entirely in that case, so
  // hasFetched never flips true, but loading does settle to false.
  const initialLoadComplete = (vehiclesHasFetched || !vehiclesLoading) && pendingChallansLoaded;

  if (!initialLoadComplete) {
    return (
      <Layout>
        <div className="w-full py-6">
          <div className="flex items-center justify-center py-24">
            <Loader text="Loading Transport Safety..." />
          </div>
        </div>
      </Layout>
    );
  }

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
          <VehiclesList showAddVehicle={showAddVehicle} setShowAddVehicle={setShowAddVehicle} />
        </div>
      </div>

      {/* Add Vehicle Dialog */}
      <AddVehicleDialog
        open={showAddVehicle && !isReadOnlySwitchedContext}
        onClose={() => setShowAddVehicle(false)}
      />
    </Layout>
  );
};

export default TransportSafetyPage;
