import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/utils/dateUtils';
import { AlertTriangle, Circle } from 'lucide-react';
import { Vehicle, VehicleChallans } from '@/types/transportSafety';
import { transformVehicleData, transformApiResponseData } from '@/utils/transport-safety/documentStatusUtils';
import { Badge } from '@/components/ui/badge';

interface VerificationDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    challanSnapshot?: any | null;
    challanError?: string | null;
    hasChallanData?: boolean;
    vehicle?: Vehicle;
    apiResponse?: any; // API response from vehicle-verify edge function
    vehicleChallans?: VehicleChallans | null; // vehicle_challans from database
    showChallanTabs?: boolean; // If false, shows all challans without Pending/Disposed tabs (for TransportChallansPage)
    hideMainTabs?: boolean; // If true, hides Verification/Challan Details tabs and shows only challan content (for TransportChallansPage)
}

const VerificationDetailsDialog: React.FC<VerificationDetailsDialogProps> = ({
    open,
    onOpenChange,
    challanSnapshot,
    challanError,
    title = 'Verification Details',
    vehicle,
    apiResponse,
    vehicleChallans,
    showChallanTabs = true, // Default to true to maintain existing behavior
    hideMainTabs = false, // Default to false to maintain existing behavior
}) => {
    const [activeTab, setActiveTab] = React.useState<'verification' | 'challan'>('verification');

    // Get provider name for display
    const getProviderName = (provider?: string | null): string => {
        // Try to get provider from API response first
        if (apiResponse?.original) {
            // Determine provider from API response structure
            if (apiResponse.original.status_code !== undefined) {
                return 'QuickEKYC';
            } else if (apiResponse.original.success !== undefined) {
                return 'Surepass';
            }
        }
        
        // Fallback to vehicle provider
        if (!provider) return 'API';
        return provider === 'surepass' ? 'Surepass' : provider === 'quickeyc' ? 'QuickEKYC' : provider;
    };

    const latestChallanSuccessLog = React.useMemo(() => {
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
            data: log.data?.data, // real challan payload
        };
    }, [vehicleChallans]);


    // Transform vehicle data using common utility function
    const transformedData = React.useMemo(() => {
        // Priority 1: Use API response data directly (from vehicle-verify edge function)
        if (apiResponse) {
            // Use vehicleChallans prop (from database) or fallback to vehicle.vehicleChallans
            return transformApiResponseData(apiResponse, null);
        }
        
        // Priority 2: Use vehicle with current_rc_data and vehicle_challans
        if (vehicle) {
            return transformVehicleData(vehicle);
        }
        
        // Priority 3: Fallback to verificationData array (legacy)
        
        return [];
    }, [apiResponse, vehicle]);
    const latestLogTimestamp = React.useMemo(() => {
        const logs = vehicleChallans?.challan_history_log;
        if (!logs || typeof logs !== 'object') return null;

        return Object.keys(logs)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    }, [vehicleChallans]);
    const shouldShowLatestChallanCheck = React.useMemo(() => {
        if (!latestChallanSuccessLog?.timestamp) return false;
        if (!latestLogTimestamp) return false;

        return latestChallanSuccessLog.timestamp !== latestLogTimestamp;
    }, [latestChallanSuccessLog, latestLogTimestamp]);


    // Format data for display (convert to label/value format)
    const rcDataForDisplay = React.useMemo(() => {
        return transformedData
            .filter((item) => {
                const fieldName = item.field?.toLowerCase() || '';
                // Exclude challan_details and client_id variations
                return item.field !== 'challan_details' && 
                       fieldName !== 'client_id' && 
                       fieldName !== 'clientid' &&
                       !fieldName.includes('client id');
            })
            .map((item) => ({
                label: item.field
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c: string) => c.toUpperCase()),
                value: item.value,
            }));
    }, [transformedData]);

    // Get challan details from vehicle_challans.latest_challan_data (priority) or transformed data
    const challanDetails = React.useMemo(() => {
        const challanData = latestChallanSuccessLog?.data;
        if (!challanData) return [];

        return (
            challanData?.challan_details?.challans ||
            challanData?.challan_data ||
            []
        );
    }, [latestChallanSuccessLog]);
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

    // Calculate total amount for all challans (when showChallanTabs is false)
    const totalChallanAmount = React.useMemo(() => {
        return challanDetails.reduce((sum, challan) => {
            const amount = Number(challan.amount || challan.challan_amount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    }, [challanDetails]);
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
                                {challan.challan_number || challan.challan_no || 'N/A'}
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
                        {challan.challan_date_time && (
                            <div>
                                <div className="text-xs font-semibold text-gray-500 mb-1">Date</div>
                                <div className="text-sm text-gray-900">
                                    {formatDateTime(new Date(challan.challan_date_time))}
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
                    <DialogTitle>{title}</DialogTitle>
                    {!hideMainTabs && (
                        <DialogDescription>
                            Registration details verified through {getProviderName(vehicle?.provider)} API.
                        </DialogDescription>
                    )}
                    {shouldShowLatestChallanCheck && (
                    <div className="mt-1 text-xs text-gray-500 flex items-center">
                        <Circle className="h-3.5 w-3.5 mr-1.5 fill-yellow-500 stroke-yellow-500" />
                        Latest successful check •{" "}
                        {formatDateTime(new Date(latestChallanSuccessLog.timestamp))}
                    </div>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-4 no-scrollbar rounded-b-lg">
                    {hideMainTabs ? (
                        // When hideMainTabs is true, show only challan content without main tabs
                        <>
                            {challanError && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-4 text-center">
                                    {challanError}
                                </div>
                            )}

                            {!challanError && challanDetails.length === 0 && (
                                <div className="text-sm text-gray-500 text-center py-6">
                                    No challans
                                </div>
                            )}

                            {!challanError && challanDetails.length > 0 && (
                                <div className="mt-4">
                                    <div className="flex justify-end mb-3">
                                        <Badge className="border-orange-300 text-orange-700 bg-orange-50 font-semibold px-3 py-1">
                                            Total Amount: ₹{totalChallanAmount.toLocaleString('en-IN')}
                                        </Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {challanDetails.map((challan: any, index: number) => (
                                            <ChallanCard key={index} challan={challan} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <Tabs defaultValue={showChallanTabs === false ? "challan" : "verification"} className="w-full">
                        <div className="sticky top-0 z-10 bg-white pb-2 pt-2 -mx-6 px-6 border-b border-gray-200">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="verification">Verification</TabsTrigger>
                                <TabsTrigger value="challan" className="flex items-center gap-2 relative">
                                    Challan Details
                                    {challanError ? (
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                    ) : challanDetails.length > 0 ? (
                                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-sm">
                                            {challanDetails.length}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 font-normal">
                                            (0)
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Verification */}
                        <TabsContent value="verification">
                            <div className="border rounded-md divide-y">
                                {rcDataForDisplay.length > 0 ? (
                                    rcDataForDisplay.map((field, index) => (
                                        <div key={index} className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-500 mb-1">
                                                {field.label}
                                            </div>
                                            <div className="text-gray-900 break-words">
                                                {typeof field.value === 'object' && field.value !== null
                                                    ? JSON.stringify(field.value, null, 2)
                                                    : field.value ?? '-'}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                        No verification data available
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Challan */}
                        <TabsContent value="challan">
                            {challanError && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-4 text-center">
                                    {challanError}
                                </div>
                            )}

                            {!challanError && challanDetails.length === 0 && (
                                <div className="text-sm text-gray-500 text-center py-6">
                                    No challans
                                </div>
                            )}

                            {!challanError && challanDetails.length > 0 && (
                                <>
                                    {showChallanTabs ? (
                                        <div className="mt-4">
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
                                        </div>
                                    ) : (
                                        // When showChallanTabs is false, show all challans without nested tabs (for TransportChallansPage)
                                        <div className="mt-4">
                                            <div className="flex justify-end mb-3">
                                                <Badge className="border-orange-300 text-orange-700 bg-orange-50 font-semibold px-3 py-1">
                                                    Total Amount: ₹{totalChallanAmount.toLocaleString('en-IN')}
                                                </Badge>
                                            </div>
                                            <div className="space-y-3">
                                                {challanDetails.map((challan: any, index: number) => (
                                                    <ChallanCard key={index} challan={challan} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
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

export default VerificationDetailsDialog;

