import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts';
import { Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import VehicleTypeIcon from '@/components/transport-safety/VehicleTypeIcon';
import VehicleSearchBar from '@/components/transport-safety/filters/VehicleSearchBar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

import type { Vehicle } from '@/types/transportSafety';
import {
  getPendingChallans,
  getVehiclesWithPendingChallans,
} from '@/services/transport-safety/vehicleService';
import { formatDate } from '@/lib/utils';

const PendingChallansList = () => {
  const { employeeData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllChallans, setShowAllChallans] = useState(false);
  const [challanDetails, setChallanDetails] = useState<any[]>([]);

  const getTotalPendingAmount = (
    verificationData: Vehicle['verificationData']
  ): number => {
    const pending = getPendingChallans(verificationData ?? []);

    return pending.reduce((sum, challan) => {
      const amount = Number(challan.challan_amount ?? challan.amount ?? 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const totalPendingAllVehicles = useMemo(() => {
    return vehicles.reduce(
      (sum, vehicle) =>
        sum + getTotalPendingAmount(vehicle.verificationData),
      0
    );
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return vehicles.filter(vehicle =>
      vehicle.internalVehicleName?.toLowerCase().includes(query) ||
      vehicle.registrationNumber?.toLowerCase().includes(query) ||
      vehicle.typeName?.toLowerCase().includes(query)
    );
  }, [vehicles, searchQuery]);

  const totalSelectedVehicleAmount = useMemo(() => {
    return challanDetails.reduce((sum, challan) => {
      const amount = Number(challan.amount ?? challan.challan_amount ?? 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }, [challanDetails]);

  useEffect(() => {
    if (!employeeData?.clientId) return;

    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const data = await getVehiclesWithPendingChallans(
          employeeData.clientId
        );
        setVehicles(data);
      } catch (error) {
        console.error('Failed to fetch pending challans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [employeeData?.clientId]);

  if (loading) {
    return <p className="p-4 text-sm text-gray-500">Loading...</p>;
  }


  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Search bar */}
      <div className="px-4 py-3 border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2">
            <VehicleSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="flex items-center gap-2 h-9"
              >
                <Filter className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Right: Total Pending Amount */}
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Pending Amount</p>
            <p className="text-lg font-bold text-red-700">
              ₹{totalPendingAllVehicles.toLocaleString('en-IN')}
            </p>
          </div>

        </div>
      </div>


      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Vehicle Name</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Challans</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                  No matching vehicles found
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map(vehicle => {
                const pendingChallans = getPendingChallans(
                  vehicle.verificationData ?? []
                );
                const totalAmount = getTotalPendingAmount(
                  vehicle.verificationData
                );

                return (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                        <VehicleTypeIcon
                          icon={vehicle.vehicleTypeIcon}
                          type={vehicle.typeName}
                          size={20}
                        />
                      </div>
                    </TableCell>

                    <TableCell className="font-medium">
                      {vehicle.internalVehicleName || '—'}
                    </TableCell>

                    <TableCell>{vehicle.registrationNumber}</TableCell>

                    <TableCell>
                      <Badge className="border-red-300 text-red-700 bg-red-50 font-semibold">
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-800 border border-amber-300">
                        {pendingChallans.length} Pending
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <button
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => {
                          setChallanDetails(pendingChallans);
                          setShowAllChallans(true);
                        }}
                      >
                        View challans
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAllChallans} onOpenChange={setShowAllChallans}>
        <DialogContent className="max-h-[80vh] max-w-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Challans</DialogTitle>
            <div className="mt-2 flex justify-end">
              <Badge className="border-red-300 text-red-700 bg-red-50 font-semibold">
                ₹{totalSelectedVehicleAmount.toLocaleString('en-IN')}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            {(challanDetails || []).map((challan: any, index: number) => (
              <div key={index} className="border rounded-md p-3 bg-orange-50">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Challan No:</span>
                  <span>{challan.challan_number || challan.challan_no || 'N/A'}</span>
                </div>

                {challan.accused_name && (
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Accused Name:</span>
                    <span className="text-gray-700">{challan.accused_name}</span>
                  </div>
                )}

                {challan.challan_date && (
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Date:</span>
                    <span className="text-gray-700">{formatDate(challan.challan_date)}</span>
                  </div>
                )}
                
                {challan.challan_place && (
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Place:</span>
                    <span className="text-gray-700">{challan.challan_place}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs">
                  <span className="font-medium">Amount:</span>
                  <span>₹{challan.amount || challan.challan_amount || "0"}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="font-medium">Status:</span>
                  <span className={challan.challan_status?.toUpperCase() === "PAID" ||
                    challan.challan_status?.toUpperCase() === "DISPOSED"
                    ? "text-green-600"
                    : "text-red-600"}>
                    {challan.challan_status || "UNPAID"}
                  </span>
                </div>

                {(challan.Info || challan.challan_info || challan.offense_details) && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="font-medium">Info:</span>
                    <span>{challan.Info || challan.challan_info || challan.offense_details}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default PendingChallansList;
