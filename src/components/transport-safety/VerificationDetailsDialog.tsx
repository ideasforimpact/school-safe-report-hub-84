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
import { AlertTriangle } from 'lucide-react';

interface VerificationDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    verificationData: any[] | null;
    title?: string;
    challanError?: string | null;
    hasChallanData?: boolean;
}

const VerificationDetailsDialog: React.FC<VerificationDetailsDialogProps> = ({
    open,
    onOpenChange,
    challanError,
    verificationData,
    title = 'Verification Details',
}) => {
    const [activeTab, setActiveTab] = React.useState<'verification' | 'challan'>('verification');

    const formatVerificationData = (data: any[]) => {
        if (!Array.isArray(data)) return [];

        return data
            .filter((item: any) => {
                const field = String(item.field || '').toLowerCase();
                return ![
                    'verification_log',
                    'last_response',
                    'status',
                    'challan_details',
                    'client_id',
                    'clientid',
                    'response_metadata',
                    'less_info',
                ].some(f => field.includes(f));
            })
            .map((item: any) => ({
                label: item.field
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c: string) => c.toUpperCase()),
                value: item.value,
            }));
    };

    const challanDetails =
        verificationData
            ?.find((i: any) => i.field === 'challan_details')
            ?.value?.challan_details?.challans ?? [];

    const disposedChallans = challanDetails.filter((c: any) =>
        ['DISPOSED', 'PAID'].includes(c.challan_status?.toUpperCase())
    );

    const pendingChallans = challanDetails.filter((c: any) =>
        !['DISPOSED', 'PAID'].includes(c.challan_status?.toUpperCase())
    );
    const ChallanCard = ({ challan }: { challan: any }) => (
        <div className="border-b border-orange-200 pb-2 last:border-b-0">
            <div className="flex justify-between text-xs">
                <span className="font-medium">Challan No:</span>
                <span>{challan.challan_number || challan.challan_no || 'N/A'}</span>
            </div>

            {challan.accused_name && (
                <div className="flex justify-between text-xs">
                    <span className="font-medium">Accused Name:</span>
                    <span>{challan.accused_name}</span>
                </div>
            )}

            {challan.challan_date_time && (
                <div className="flex justify-between text-xs">
                    <span className="font-medium">Date:</span>
                    <span>{formatDateTime(new Date(challan.challan_date_time))}</span>
                </div>
            )}

            {challan.challan_place && (
                <div className="flex justify-between text-xs">
                    <span className="font-medium">Place:</span>
                    <span>{challan.challan_place}</span>
                </div>
            )}

            <div className="flex justify-between text-xs">
                <span className="font-medium">Amount:</span>
                <span>₹{challan.amount || challan.challan_amount || '0'}</span>
            </div>

            <div className="flex justify-between text-xs">
                <span className="font-medium">Status:</span>
                <span
                    className={
                        ['DISPOSED', 'PAID'].includes(challan.challan_status?.toUpperCase())
                            ? 'text-green-600'
                            : 'text-red-600'
                    }
                >
                    {challan.challan_status || 'UNPAID'}
                </span>
            </div>

            {(challan.Info ||
                challan.challan_info ||
                challan.offense_details) && (
                    <div className="flex justify-between text-xs mt-1">
                        <span className="font-medium">Info:</span>
                        <span>
                            {challan.Info ||
                                challan.challan_info ||
                                challan.offense_details}
                        </span>
                    </div>
                )}
        </div>
    );


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[100vh] max-h-[80vh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Registration details verified through Surepass API.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="verification">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="verification">Verification</TabsTrigger>
                        <TabsTrigger value="challan" className="flex items-center gap-2">
                            Challan Details
                            {challanError ? (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            ) : (
                                <span className="text-xs text-gray-500">
                                    ({challanDetails.length})
                                </span>
                            )}
                        </TabsTrigger>

                    </TabsList>

                    {/* Verification */}
                    <TabsContent value="verification">
                        <div className="border rounded-md divide-y">
                            {formatVerificationData(verificationData ?? []).map(
                                (field, index) => (
                                    <div key={index} className="px-4 py-3">
                                        <div className="text-sm font-medium text-gray-500 mb-1">
                                            {field.label}
                                        </div>
                                        <div className="text-gray-900 break-words">
                                            {typeof field.value === 'object'
                                                ? JSON.stringify(field.value)
                                                : field.value}
                                        </div>
                                    </div>
                                )
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
                            <Tabs defaultValue="pending" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="pending">
                                        Pending ({pendingChallans.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="disposed">
                                        Disposed ({disposedChallans.length})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="pending">
                                    {pendingChallans.length > 0 ? (
                                        <div className="space-y-2 border rounded-md p-3 bg-orange-50">
                                            {pendingChallans.map((challan: any, index: number) => (
                                                <ChallanCard key={index} challan={challan} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-6">
                                            No pending challans
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="disposed">
                                    {disposedChallans.length > 0 ? (
                                        <div className="space-y-2 border rounded-md p-3 bg-green-50">
                                            {disposedChallans.map((challan: any, index: number) => (
                                                <ChallanCard key={index} challan={challan} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-6">
                                            No disposed challans
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default VerificationDetailsDialog;
