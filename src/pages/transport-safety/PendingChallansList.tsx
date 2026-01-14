import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts';
import { Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import VehicleTypeIcon from '@/components/transport-safety/VehicleTypeIcon';
import VehicleSearchBar from '@/components/transport-safety/filters/VehicleSearchBar';
import VerificationDetailsDialog from '@/components/transport-safety/VerificationDetailsDialog';
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
  getPendingChallansFromVehicleChallans,
  getVehiclesWithPendingChallans,
} from '@/services/transport-safety/vehicleService';

const PendingChallansList = () => {
  const { employeeData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChallanDetails, setShowChallanDetails] = useState(false);
  const [selectedVehicleChallans, setSelectedVehicleChallans] = useState<Vehicle['vehicleChallans'] | null>(null);

  const getTotalPendingAmount = (
    vehicleChallans: Vehicle['vehicleChallans']
  ): number => {
    const pending = getPendingChallansFromVehicleChallans(vehicleChallans || null);

    return pending.reduce((sum, challan) => {
      const amount = Number(challan.challan_amount ?? challan.amount ?? 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const totalPendingAllVehicles = useMemo(() => {
    return vehicles.reduce(
      (sum, vehicle) =>
        sum + getTotalPendingAmount(vehicle.vehicleChallans),
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
                const pendingChallans = getPendingChallansFromVehicleChallans(
                  vehicle.vehicleChallans || null
                );
                const totalAmount = getTotalPendingAmount(
                  vehicle.vehicleChallans
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
                          setSelectedVehicleChallans(vehicle.vehicleChallans || null);
                          setShowChallanDetails(true);
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

      <VerificationDetailsDialog
        open={showChallanDetails}
        onOpenChange={setShowChallanDetails}
        vehicleChallans={selectedVehicleChallans}
        title="Challan Details"
        showChallanTabs={false}
        hideMainTabs={true}
        verificationData={null}
      />

    </div>
  );
};

export default PendingChallansList;
