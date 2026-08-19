import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import VehicleTypeIcon from '@/components/transport-safety/VehicleTypeIcon';
import { formatDate } from '@/lib/Dateformat';
import { RawChallan } from '@/services/transport-safety/vehicleService';

interface VehicleChallanHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleName: string;
  vehicleRegistration: string;
  vehicleTypeIcon?: string | null;
  vehicleTypeName?: string;
  challans: RawChallan[];
  totalAmount: number;
  isPaid: boolean;
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

const VehicleChallanHistoryDialog: React.FC<VehicleChallanHistoryDialogProps> = ({
  open,
  onOpenChange,
  vehicleName,
  vehicleRegistration,
  vehicleTypeIcon,
  vehicleTypeName,
  challans,
  totalAmount,
  isPaid,
}) => {
  const sortedChallans = React.useMemo(() => {
    return [...challans].sort((a, b) => {
      const dateA = getChallanDate(a)?.getTime() ?? 0;
      const dateB = getChallanDate(b)?.getTime() ?? 0;
      return dateB - dateA;
    });
  }, [challans]);

  const statusLabel = isPaid ? 'Paid' : 'Pending';
  const dotClass = isPaid ? 'bg-green-500' : 'bg-amber-500';
  const summaryBoxClass = isPaid
    ? 'bg-green-50 border border-green-200'
    : 'bg-amber-50 border border-amber-200';
  const summaryTextClass = isPaid ? 'text-green-700' : 'text-amber-700';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col [&>button]:hidden">
        <DialogHeader className="flex-row items-center justify-between space-y-0">
          <DialogTitle>Vehicle Challans</DialogTitle>
          <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <VehicleTypeIcon icon={vehicleTypeIcon} type={vehicleTypeName} size={22} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{vehicleName}</p>
            <p className="text-sm text-gray-500">{vehicleRegistration}</p>
          </div>
        </div>

        <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${summaryBoxClass}`}>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dotClass}`} />
            <span className={`text-sm font-semibold ${summaryTextClass}`}>
              {sortedChallans.length} {statusLabel} Challan{sortedChallans.length === 1 ? '' : 's'}
            </span>
          </div>
          <span className="text-sm text-gray-700">
            Total <span className="font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-2">
            Challan History
          </p>

          <div className="grid grid-cols-3 gap-2 px-1 pb-2 text-xs font-medium text-gray-400 uppercase">
            <span>Date</span>
            <span>Amount</span>
            <span>Status</span>
          </div>

          <div>
            {sortedChallans.map((challan, index) => (
              <div
                key={challan.challan_number || challan.challan_no || index}
                className="grid grid-cols-3 gap-2 items-center px-1 py-3 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm text-gray-900">{getChallanDateLabel(challan)}</span>
                <span className="text-sm font-medium text-gray-900">
                  ₹{getChallanAmount(challan).toLocaleString('en-IN')}
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                  <span className={summaryTextClass}>{statusLabel}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleChallanHistoryDialog;
