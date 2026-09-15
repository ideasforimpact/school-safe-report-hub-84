import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, Car } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import VehiclesList from '@/components/transport-safety/VehiclesList';
import AddVehicleDialog from '@/components/transport-safety/AddVehicleDialog';
import { useAuth } from '@/contexts';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import { useTransportSafetyAccess } from '@/hooks/useModuleAccess';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';
import {
  getVehiclesWithChallans,
  getPendingChallansFromVehicleChallans,
  getPaidChallansFromVehicleChallans,
  getAllVehicles,
} from '@/services/transport-safety/vehicleService';
import { hasExpiredDocuments } from '@/utils/transport-safety/documentStatusUtils';
import Loader from '@/components/common/Loader';

const TransportSafetyPage = () => {
  const { employeeData } = useAuth();
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingChallanCount, setPendingChallanCount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paidChallanCount, setPaidChallanCount] = useState(0);
  const [pendingChallansLoaded, setPendingChallansLoaded] = useState(false);
  const [compliantCount, setCompliantCount] = useState(0);
  const [nonCompliantCount, setNonCompliantCount] = useState(0);
  const [nonCompliantLoaded, setNonCompliantLoaded] = useState(false);

  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  const navigate = useNavigate();
  const { isSuperAdmin, hasTransportSafetyAdmin, currentEmployeeId } = useTransportSafetyAccess();
  const hasFullVehicleAccess = isSuperAdmin || hasTransportSafetyAdmin;

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
        const vehicles = await getVehiclesWithChallans(employeeData.clientId, { employeeId: currentEmployeeId, isAdmin: hasFullVehicleAccess });
        if (cancelled) return;

        let totalPendingAmount = 0;
        let totalPendingCount = 0;
        let totalPaidAmount = 0;
        let totalPaidCount = 0;

        const sumChallanAmount = (challans: { amount?: string | number; challan_amount?: string | number }[]) =>
          challans.reduce((sum, c) => {
            const amount = Number(c.amount || c.challan_amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);

        vehicles.forEach(vehicle => {
          const pending = getPendingChallansFromVehicleChallans(vehicle.vehicleChallans || null);
          const paid = getPaidChallansFromVehicleChallans(vehicle.vehicleChallans || null);
          totalPendingCount += pending.length;
          totalPendingAmount += sumChallanAmount(pending);
          totalPaidCount += paid.length;
          totalPaidAmount += sumChallanAmount(paid);
        });

        setPendingAmount(totalPendingAmount);
        setPendingChallanCount(totalPendingCount);
        setPaidAmount(totalPaidAmount);
        setPaidChallanCount(totalPaidCount);
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
  }, [employeeData?.clientId, currentEmployeeId, hasFullVehicleAccess]);

  // Compliant/non-compliant counts must reflect every vehicle, not just the
  // current page of VehiclesList, so — same as pending challans above —
  // they're computed from a separate, unpaginated fetch keyed ONLY on
  // clientId. A vehicle that has never been run through a safety check has
  // no verificationData at all — hasExpiredDocuments treats that as "not
  // expired" (unverified, not confirmed bad), so it must NOT be counted as
  // compliant either, or a never-checked vehicle would misleadingly show up
  // as safe. Only vehicles that have actually been verified and have no
  // expired/missing document count as compliant.
  useEffect(() => {
    if (!employeeData?.clientId) {
      setNonCompliantLoaded(true);
      return;
    }

    let cancelled = false;

    const loadCompliance = async () => {
      try {
        const vehicles = await getAllVehicles(employeeData.clientId, undefined, { employeeId: currentEmployeeId, isAdmin: hasFullVehicleAccess });
        if (cancelled) return;

        const isVerified = (vehicle: typeof vehicles[number]) =>
          Boolean(vehicle.verificationData && vehicle.verificationData.length > 0);

        setNonCompliantCount(vehicles.filter(hasExpiredDocuments).length);
        setCompliantCount(
          vehicles.filter(vehicle => isVerified(vehicle) && !hasExpiredDocuments(vehicle)).length,
        );
      } catch (error) {
        console.error('Failed to load compliance counts:', error);
      } finally {
        if (!cancelled) setNonCompliantLoaded(true);
      }
    };

    loadCompliance();

    return () => {
      cancelled = true;
    };
  }, [employeeData?.clientId, currentEmployeeId, hasFullVehicleAccess]);

  // The page's first paint waits on ALL data sources before rendering
  // anything — vehicles (context: hasFetched), pending challans
  // (pendingChallansLoaded), and non-compliant count (nonCompliantLoaded).
  // `!vehiclesLoading` is included alongside hasFetched to cover the edge
  // case where there's no clientId at all — TransportSafetyContext skips
  // the fetch entirely in that case, so hasFetched never flips true, but
  // loading does settle to false.
  const initialLoadComplete =
    (vehiclesHasFetched || !vehiclesLoading) && pendingChallansLoaded && nonCompliantLoaded;

  if (!initialLoadComplete) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <Loader text="Loading Transport Safety..." />
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

                <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-x-28 gap-y-6">
                  <div className="sm:max-w-[180px]">
                    <p className="text-sm text-gray-500">Total Vehicles</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      {totalVehicles}
                    </p>
                  </div>

                  <div className="sm:max-w-[180px]">
                    <p className="text-sm text-gray-500">Compliant Vehicles</p>
                    <p className="text-3xl font-semibold text-green-600">
                      {compliantCount}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Valid Insurance, FC, and PUC
                    </p>
                  </div>

                  <div className="sm:max-w-[180px]">
                    <p className="text-sm text-gray-500">Non-Compliant Vehicles</p>
                    <p className="text-3xl font-semibold text-red-600">
                      {nonCompliantCount}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Expired or missing Insurance, FC, or PUC
                    </p>
                  </div>

                  <div className="sm:max-w-[210px]">
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
                      onClick={() => navigate('/transport-safety/challans?type=pending')}
                      className="mt-2 inline-flex items-center gap-1 text-sm text-orange-600 hover:underline whitespace-nowrap"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View all pending challans →
                    </button>
                  </div>

                  <div className="sm:max-w-[210px]">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Paid Challan</p>
                      {paidChallanCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-green-500 rounded-full">
                          {paidChallanCount}
                        </span>
                      )}
                    </div>
                    <p className="text-3xl font-semibold text-green-600">
                      ₹{paidAmount.toLocaleString('en-IN')}
                    </p>

                    <button
                      onClick={() => navigate('/transport-safety/challans?type=paid')}
                      className="mt-2 inline-flex items-center gap-1 text-sm text-green-600 hover:underline whitespace-nowrap"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View all paid challans →
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
