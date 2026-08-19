import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts';
import { useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VehicleTypeIcon from '@/components/transport-safety/VehicleTypeIcon';
import VehicleSearchBar from '@/components/transport-safety/filters/VehicleSearchBar';
import VerificationDetailsDialog from '@/components/transport-safety/VerificationDetailsDialog';
import VehicleChallanHistoryDialog from '@/components/transport-safety/VehicleChallanHistoryDialog';
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
  getPaidChallansFromVehicleChallans,
  filterChallansByDateRange,
  getVehiclesWithPendingChallans,
  getVehiclesWithChallans,
  RawChallan,
} from '@/services/transport-safety/vehicleService';
import { formatDate } from '@/lib/Dateformat';
import Loader from '@/components/common/Loader';

type ChallanType = 'pending' | 'paid';

interface VehicleChallanGroup {
  vehicle: Vehicle;
  challans: RawChallan[];
  totalAmount: number;
}

const getChallanAmount = (challan: RawChallan): number => {
  const amount = Number(challan.challan_amount ?? challan.amount ?? 0);
  return isNaN(amount) ? 0 : amount;
};

const getChallanDate = (challan: RawChallan): Date | null => {
  const raw = challan.challan_date_time || challan.challan_date;
  if (!raw) return null;
  const date = new Date(String(raw));
  return isNaN(date.getTime()) ? null : date;
};

const getChallanDateLabel = (challan: RawChallan): string => {
  const date = getChallanDate(challan);
  return date ? formatDate(date) : '—';
};

const PendingChallansList = () => {
  const { employeeData } = useAuth();
  const [searchParams] = useSearchParams();

  const [challanType, setChallanType] = useState<ChallanType>(
    searchParams.get('type') === 'paid' ? 'paid' : 'pending',
  );
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Clicking the row itself — new compact challan-history modal.
  const [showHistory, setShowHistory] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<VehicleChallanGroup | null>(null);

  // "View challans" button — unchanged old flow (full VerificationDetailsDialog).
  const [showChallanDetails, setShowChallanDetails] = useState(false);
  const [selectedVehicleChallans, setSelectedVehicleChallans] = useState<Vehicle['vehicleChallans'] | null>(null);

  // Follow the `type` query param whenever it changes (e.g. the dashboard's
  // "View all paid challans" link navigating here while already mounted).
  useEffect(() => {
    setChallanType(searchParams.get('type') === 'paid' ? 'paid' : 'pending');
  }, [searchParams]);

  useEffect(() => {
    if (!employeeData?.clientId) return;

    let cancelled = false;

    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const data = challanType === 'paid'
          ? await getVehiclesWithChallans(employeeData.clientId)
          : await getVehiclesWithPendingChallans(employeeData.clientId);
        if (!cancelled) setVehicles(data);
      } catch (error) {
        console.error(`Failed to fetch ${challanType} challans:`, error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVehicles();

    return () => {
      cancelled = true;
    };
  }, [employeeData?.clientId, challanType]);

  // One group per vehicle, holding every challan (of the selected type/date
  // range) that vehicle has.
  const vehicleGroups = useMemo(() => {
    const getChallans = challanType === 'paid'
      ? getPaidChallansFromVehicleChallans
      : getPendingChallansFromVehicleChallans;

    return vehicles
      .map((vehicle): VehicleChallanGroup => {
        const challans = filterChallansByDateRange(
          getChallans(vehicle.vehicleChallans || null),
          dateRange,
        );
        return {
          vehicle,
          challans,
          totalAmount: challans.reduce((sum, c) => sum + getChallanAmount(c), 0),
        };
      })
      .filter(group => group.challans.length > 0);
  }, [vehicles, dateRange, challanType]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return vehicleGroups;

    return vehicleGroups.filter(({ vehicle }) =>
      vehicle.internalVehicleName?.toLowerCase().includes(query) ||
      vehicle.registrationNumber?.toLowerCase().includes(query) ||
      vehicle.typeName?.toLowerCase().includes(query)
    );
  }, [vehicleGroups, searchQuery]);

  const totalAllVehicles = useMemo(
    () => vehicleGroups.reduce((sum, group) => sum + group.totalAmount, 0),
    [vehicleGroups],
  );

  const hasActiveFilters = Boolean(searchQuery || dateRange?.from || dateRange?.to);

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange(undefined);
  };

  const openHistory = (group: VehicleChallanGroup) => {
    setSelectedGroup(group);
    setShowHistory(true);
  };

  const isPaid = challanType === 'paid';
  const amountBadgeClass = isPaid
    ? 'border-green-300 text-green-700 bg-green-50 font-semibold'
    : 'border-red-300 text-red-700 bg-red-50 font-semibold';
  const amountColorClass = isPaid ? 'text-green-700' : 'text-red-700';
  const statusBadgeClass = isPaid
    ? 'bg-green-100 text-green-800 border border-green-300'
    : 'bg-amber-100 text-amber-800 border border-amber-300';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader text="Loading Challans..." />
      </div>
    );
  }


  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Filters */}
      <div className="px-4 py-3 border-b">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <VehicleSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            <DatePickerWithRange
              date={dateRange}
              onChange={setDateRange}
              className="sm:w-auto"
            />

            <Select value={challanType} onValueChange={(value) => setChallanType(value as ChallanType)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2 h-9"
              >
                <Filter className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Right: Total Amount */}
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {isPaid ? 'Total Paid Amount' : 'Total Pending Amount'}
            </p>
            <p className={`text-lg font-bold ${amountColorClass}`}>
              ₹{totalAllVehicles.toLocaleString('en-IN')}
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
            {filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  <p>
                    {hasActiveFilters
                      ? 'No matching vehicles found'
                      : `No ${isPaid ? 'paid' : 'pending'} challans to display`}
                  </p>
                  {!hasActiveFilters && (
                    <p className="mt-1 text-xs text-gray-400">
                      A vehicle only appears here once it has completed at least one successful
                      safety check. If a vehicle you expect to see is missing, its last check may
                      still be pending or may have failed — this isn't the same as having zero
                      challans.
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => {
                const { vehicle, challans, totalAmount } = group;
                const sortedChallans = [...challans].sort(
                  (a, b) => (getChallanDate(b)?.getTime() ?? 0) - (getChallanDate(a)?.getTime() ?? 0),
                );
                const latest = sortedChallans[0];
                const moreCount = sortedChallans.length - 1;

                return (
                  <TableRow
                    key={vehicle.id}
                    className="cursor-pointer select-none hover:bg-gray-50"
                    onClick={() => openHistory(group)}
                  >
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
                      <Badge className={amountBadgeClass}>
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusBadgeClass}>
                          {challans.length} {isPaid ? 'Paid' : 'Pending'}
                        </Badge>
                        {latest && (
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            ₹{getChallanAmount(latest).toLocaleString('en-IN')} • {getChallanDateLabel(latest)}
                          </span>
                        )}
                        {moreCount > 0 && (
                          <span className="text-sm text-gray-400">+{moreCount} more</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <button
                        className="text-sm text-blue-600 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
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

      {/* Old flow — unchanged. Triggered only by the "View challans" button. */}
      <VerificationDetailsDialog
        open={showChallanDetails}
        onOpenChange={setShowChallanDetails}
        vehicleChallans={selectedVehicleChallans}
        title="Challan Details"
        showChallanTabs={false}
        hideMainTabs={true}
        dateRange={dateRange}
        challanStatusFilter={challanType}
      />

      {/* New compact modal — triggered by clicking anywhere else on the row. */}
      <VehicleChallanHistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        vehicleName={selectedGroup?.vehicle.internalVehicleName || selectedGroup?.vehicle.typeName || 'Vehicle'}
        vehicleRegistration={selectedGroup?.vehicle.registrationNumber || ''}
        vehicleTypeIcon={selectedGroup?.vehicle.vehicleTypeIcon}
        vehicleTypeName={selectedGroup?.vehicle.typeName}
        challans={selectedGroup?.challans || []}
        totalAmount={selectedGroup?.totalAmount || 0}
        isPaid={isPaid}
      />

    </div>
  );
};

export default PendingChallansList;
