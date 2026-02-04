import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/utils/dateUtils';
import { VehicleChallans } from '@/types/transportSafety';

interface ChallanDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicleChallans: VehicleChallans | null;
}

const ChallanDetailsDialog: React.FC<ChallanDetailsDialogProps> = ({
    open,
    onOpenChange,
    vehicleChallans,
}) => {
    const latestSuccessLog = React.useMemo(() => {
        const logs = vehicleChallans?.challan_history_log;
        if (!logs || typeof logs !== 'object') return null;

        const successLogs = Object.entries(logs).filter(
            ([_, entry]: any) => entry?.data?.status_code === 200
        );

        if (successLogs.length === 0) return null;

        successLogs.sort(
            ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
        );

        const [timestamp, log]: any = successLogs[0];

        return {
            timestamp,
            provider: log.provider,
            data: log.data?.data, 
        };
    }, [vehicleChallans]);
    // Extract challan details from vehicle_challans.latest_challan_data
   const challanDetails = React.useMemo(() => {
        const challanData = latestSuccessLog?.data;
        if (!challanData) return [];
        if (challanData?.challan_details?.challans) {
            return challanData.challan_details.challans;
        }
        if (Array.isArray(challanData?.challan_data)) {
            return challanData.challan_data;
        }
        if (Array.isArray(challanData)) {
            return challanData;
        }
        return [];
    }, [latestSuccessLog]);

    const disposedChallans = challanDetails.filter((c: any) =>
        ['DISPOSED', 'PAID'].includes(c.challan_status?.toUpperCase())
    );

    const pendingChallans = challanDetails.filter((c: any) =>
        !['DISPOSED', 'PAID'].includes(c.challan_status?.toUpperCase())
    );

    // Calculate total amounts
    const totalPendingAmount = React.useMemo(() => {
        return pendingChallans.reduce((sum, challan) => {
            const amount = Number(challan.amount || challan.challan_amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    }, [pendingChallans]);

    const totalDisposedAmount = React.useMemo(() => {
        return disposedChallans.reduce((sum, challan) => {
            const amount = Number(challan.amount || challan.challan_amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    }, [disposedChallans]);

    const ChallanCard = ({ challan }: { challan: any }) => {
        const isDisposed = ['DISPOSED', 'PAID'].includes(challan.challan_status?.toUpperCase());
        
        return (
            <div className={`p-4 rounded-lg border-2 transition-all ${
                isDisposed 
                    ? 'border-green-200 bg-green-50/50 hover:border-green-300' 
                    : 'border-orange-200 bg-orange-50/50 hover:border-orange-300'
            }`}>
                <div className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="text-xs font-semibold text-gray-500 mb-1">Challan Number</div>
                            <div className="text-sm font-bold text-gray-900">
                                {challan.challan_number || challan.challan_no || challan.number || 'N/A'}
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isDisposed
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-orange-100 text-orange-700 border border-orange-300'
                        }`}>
                            {challan.challan_status || 'UNPAID'}
                        </span>
                    </div>

                    {challan.accused_name && (
                        <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">Accused Name</div>
                            <div className="text-sm text-gray-900">{challan.accused_name}</div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {(challan.challan_date_time || challan.challan_date) && (
                            <div>
                                <div className="text-xs font-semibold text-gray-500 mb-1">Date</div>
                                <div className="text-sm text-gray-900">
                                    {formatDateTime(new Date(challan.challan_date_time || challan.challan_date))}
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">Amount</div>
                            <div className="text-sm font-semibold text-gray-900">
                                ₹{challan.amount || challan.challan_amount || '0'}
                            </div>
                        </div>
                    </div>

                    {challan.challan_place && (
                        <div>
                            <div className="text-xs font-semibold text-gray-500 mb-1">Place</div>
                            <div className="text-sm text-gray-900">{challan.challan_place}</div>
                        </div>
                    )}

                    {(challan.Info ||
                        challan.challan_info ||
                        challan.offense_details) && (
                            <div className="pt-2 border-t border-gray-200">
                                <div className="text-xs font-semibold text-gray-500 mb-1">Offense Details</div>
                                <div className="text-sm text-gray-700 leading-relaxed">
                                    {challan.Info ||
                                        challan.challan_info ||
                                        challan.offense_details}
                                </div>
                            </div>
                        )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[100vh] max-h-[80vh] flex flex-col p-0 rounded-lg overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
                    <DialogTitle>Challan Details</DialogTitle>
                    {latestSuccessLog && (
                        <div className="mt-1 text-xs text-gray-500">
                        Latest successful check •{" "}
                        {formatDateTime(new Date(latestSuccessLog.timestamp))}
                        </div>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-4 no-scrollbar rounded-b-lg">
                    {challanDetails.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                            <div className="text-sm font-medium text-gray-500">No challan data available</div>
                            <div className="text-xs text-gray-400 mt-1">No challans found for this vehicle</div>
                        </div>
                    ) : (
                        <Tabs defaultValue="pending" className="w-full">
                            <div className="sticky top-0 z-10 bg-white pb-2 pt-2 -mx-6 px-6">
                                <TabsList className="grid w-full grid-cols-2 gap-3 p-1 bg-gray-100 rounded-lg">
                                    <TabsTrigger 
                                        value="pending" 
                                        className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-700 data-[state=active]:font-semibold transition-all"
                                    >
                                        <span>Pending</span>
                                        {pendingChallans.length > 0 && (
                                            <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-xs font-bold text-white bg-orange-500 rounded-full">
                                                {pendingChallans.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="disposed" 
                                        className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-700 data-[state=active]:font-semibold transition-all"
                                    >
                                        <span>Disposed</span>
                                        {disposedChallans.length > 0 && (
                                            <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-xs font-bold text-white bg-green-500 rounded-full">
                                                {disposedChallans.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="pending" className="mt-4">
                                {pendingChallans.length > 0 ? (
                                    <div>
                                        <div className="flex justify-end mb-3">
                                            <Badge className="border-orange-300 text-orange-700 bg-orange-50 font-semibold px-3 py-1">
                                                Total Amount to Pay: ₹{totalPendingAmount.toLocaleString('en-IN')}
                                            </Badge>
                                        </div>
                                        <div className="space-y-3">
                                            {pendingChallans.map((challan: any, index: number) => (
                                                <ChallanCard key={index} challan={challan} />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-orange-200 rounded-lg bg-orange-50/30">
                                        <div className="text-sm font-medium text-gray-500">No pending challans</div>
                                        <div className="text-xs text-gray-400 mt-1">All challans have been disposed</div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="disposed" className="mt-4">
                                {disposedChallans.length > 0 ? (
                                    <div>
                                        <div className="flex justify-end mb-3">
                                            <Badge className="border-green-300 text-green-700 bg-green-50 font-semibold px-3 py-1">
                                                Total Disposed Amount: ₹{totalDisposedAmount.toLocaleString('en-IN')}
                                            </Badge>
                                        </div>
                                        <div className="space-y-3">
                                            {disposedChallans.map((challan: any, index: number) => (
                                                <ChallanCard key={index} challan={challan} />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-green-200 rounded-lg bg-green-50/30">
                                        <div className="text-sm font-medium text-gray-500">No disposed challans</div>
                                        <div className="text-xs text-gray-400 mt-1">All challans are pending</div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex-shrink-0 rounded-b-lg">
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ChallanDetailsDialog;

