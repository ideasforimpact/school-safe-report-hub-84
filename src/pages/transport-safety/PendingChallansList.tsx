import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts';
import { Eye, Filter } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { getPendingChallans } from '@/services/transport-safety/vehicleService';
import VehicleTypeIcon from '@/components/transport-safety/VehicleTypeIcon';
import VehicleSearchBar from '@/components/transport-safety/filters/VehicleSearchBar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface VehicleRow {
  id: string;
  internal_vehicle_name: string;
  registration_number: string;
  verification_data: any;
  vehicle_type?: {
    name: string;
    icon: string | null;
  };
}

const PendingChallansList = () => {
  const { employeeData } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const clearAllFilters = () => setSearchQuery('');
  const [showAllChallans, setShowAllChallans] = useState(false);
  const [challanDetails, setChallanDetails] = useState<any[]>([]);

  const getTotalPendingAmount = (verificationData: any): number => {
    const pending = getPendingChallans(verificationData);

    return pending.reduce((sum: number, challan: any) => {
      const amount = Number(challan.challan_amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const totalSelectedVehicleAmount = (challanDetails || []).reduce(
    (sum, challan) => {
      const amount = Number(challan.amount || challan.challan_amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    },
    0
  );


  const filteredVehicles = vehicles.filter(vehicle => {
    const query = searchQuery.toLowerCase();
    return (
      vehicle.internal_vehicle_name?.toLowerCase().includes(query) ||
      vehicle.registration_number?.toLowerCase().includes(query) ||
      vehicle.vehicle_type?.name?.toLowerCase().includes(query)
    );
  });

  const totalPendingAllVehicles = vehicles.reduce(
    (sum, vehicle) => sum + getTotalPendingAmount(vehicle.verification_data),
    0
  );


  useEffect(() => {
    if (!employeeData?.clientId) return;

    const fetchVehiclesWithChallans = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select(`
            id,
            internal_vehicle_name,
            registration_number,
            verification_data,
            vehicle_type:vehicle_type (
              name,
              icon
            )
          `)
          .eq('client_id', employeeData.clientId)
          .returns<VehicleRow[]>();

        if (error) throw error;

        const vehiclesWithPendingChallans = (data || []).filter(vehicle => {
          const pending = getPendingChallans(vehicle.verification_data);
          return pending.length > 0;
        });

        setVehicles(vehiclesWithPendingChallans);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehiclesWithChallans();
  }, [employeeData?.clientId]);



  if (loading) return <p>Loading...</p>;


  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Search bar */}
      <div className="px-4 py-3 border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          {/* Left: Search */}
          <div className="flex items-center gap-2">
            <VehicleSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
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
              <TableHead className="w-[80px] text-left">Type</TableHead>
              <TableHead className="w-[150px] text-left">Vehicle Name</TableHead>
              <TableHead className="w-[150px] text-left">Registration</TableHead>
              <TableHead className="w-[120px] text-left">Total Amount</TableHead>
              <TableHead className="w-[180px] text-left">Challan</TableHead>
              <TableHead className="w-[100px] text-left">Challan Detials</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-gray-500 py-6"
                >
                  No matching vehicles found
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle: VehicleRow) => {
                const pendingChallans = getPendingChallans(vehicle.verification_data);
                const totalAmount = getTotalPendingAmount(vehicle.verification_data);

                return (
                  <TableRow key={vehicle.id}>
                    {/* Type */}
                    <TableCell className="text-left">
                      <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                        <VehicleTypeIcon
                          icon={vehicle.vehicle_type?.icon}
                          type={vehicle.vehicle_type?.name}
                          className="text-gray-700"
                          size={20}
                        />
                      </div>
                    </TableCell>

                    {/* Vehicle Name */}
                    <TableCell className="font-medium">
                      {vehicle.internal_vehicle_name}
                    </TableCell>

                    {/* Registration */}
                    <TableCell className="text-sm text-gray-700">
                      {vehicle.registration_number}
                    </TableCell>

                    {/* Total Amount */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-red-300 text-red-700 bg-red-50 font-semibold"
                      >
                        ₹{totalAmount.toLocaleString("en-IN")}
                      </Badge>
                    </TableCell>

                    {/* Challan */}
                    <TableCell>
                      <Badge
                        className="bg-amber-100 text-amber-800 border border-amber-300"
                      >
                        {pendingChallans.length} Pending
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <button
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
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
            <div className="flex items-center gap-2 rounded-md px-3 py-2">
              <span className="text-sm text-gray-600">
                Total Pending Amount:
              </span>

              <Badge
                variant="outline"
                className="border-red-300 text-red-700 bg-red-50 font-semibold"
              >
                ₹{totalSelectedVehicleAmount.toLocaleString("en-IN")}
              </Badge>
            </div>
          </div>
          </DialogHeader>

          <div className="space-y-3">
            {(challanDetails || []).map((challan: any, index: number) => (
              <div
                key={index}
                className="border rounded-md p-3 bg-orange-50"
              >
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Challan No:</span>
                  <span>
                    {challan.challan_number || challan.challan_no || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between text-xs mt-1">
                  <span className="font-medium">Amount:</span>
                  <span>
                    ₹{challan.amount || challan.challan_amount || '0'}
                  </span>
                </div>

                <div
                  className={`text-xs mt-1 font-medium ${challan.challan_status?.toUpperCase() === 'PAID' ||
                    challan.challan_status?.toUpperCase() === 'DISPOSED'
                    ? 'text-green-600'
                    : 'text-red-600'
                    }`}
                >
                  {challan.challan_status || 'UNPAID'}
                </div>

                {(challan.Info || challan.challan_info) && (
                  <div className="text-xs mt-1 text-gray-600">
                    {challan.Info || challan.challan_info}
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
