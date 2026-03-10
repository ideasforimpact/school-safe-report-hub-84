
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { Label } from '@/components/ui/label';
import { FileText, User, Calendar, CreditCard, MapPin, CheckCircle, Loader2, X } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification/EmployeeVerificationContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VoterIdDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voterIdDetails: any;
  documentId?: string;
  onVerificationUpdate?: () => void;
  readOnly?: boolean;
}

const VoterIdDetailsDialog: React.FC<VoterIdDetailsDialogProps> = ({
  open,
  onOpenChange,
  voterIdDetails,
  documentId,
  onVerificationUpdate,
  readOnly = false
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();
  const { user, employeeData } = useAuth();
  if (!voterIdDetails) return null;
  
  // Extract useful information from the Voter ID verification response
  const voterInfo = voterIdDetails?.data || {};
  const isSuccess = voterIdDetails?.success === true && voterIdDetails?.status_code === 200;

  // Prepare profile image source if available
  const profileImageSrc = (() => {
    const value = (voterInfo as any)?.profile_image || (voterInfo as any)?.photo || (voterInfo as any)?.image || (voterInfo as any)?.image_url;
    if (!value || typeof value !== 'string') return undefined;
    if (value.startsWith('http') || value.startsWith('https') || value.startsWith('data:')) return value;
    return `data:image/jpeg;base64,${value}`;
  })();

  // Helper function to format field names
  const formatFieldName = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Group fields into logical categories
  const getPersonalFields = () => {
    const personalKeys = ['name_v1', 'name_v2', 'name_v3', 'epic_no', 'relation_name', 'relation_type', 'gender', 'age'];
    return Object.entries(voterInfo).filter(([key]) => personalKeys.includes(key) && voterInfo[key] !== null && voterInfo[key] !== undefined);
  };

  const getAddressFields = () => {
    const addressKeys = ['district_name', 'part_name', 'part_number', 'ac_name', 'pc_name', 'state_name', 'polling_station'];
    return Object.entries(voterInfo).filter(([key]) => addressKeys.includes(key) && voterInfo[key] !== null && voterInfo[key] !== undefined);
  };

  const getAdditionalFields = () => {
    const excludeKeys = [
      'id',
      'name_v1',
      'name_v2',
      'name_v3',
      'epic_no',
      'relation_name',
      'relation_type',
      'gender',
      'age',
      'district_name',
      'part_name',
      'part_number',
      'ac_name',
      'pc_name',
      'state_name',
      'polling_station',
      'client_id',
      // Explicitly hide noisy/unnecessary fields from the popup
      'additional_check',
      'ps_lat_long',
      'rln_name_v3'
    ];
    return Object.entries(voterInfo).filter(([key]) => !excludeKeys.includes(key) && voterInfo[key] !== null && voterInfo[key] !== undefined);
  };

  const handleVerify = async () => {
    if (!documentId) return;
    
    try {
      setIsApproving(true);
      
      // Call the voter-verification edge function directly
      const { data, error } = await supabase.functions.invoke('voter-verification', {
        body: {
          action: 'approveAfterApi',
          documentId: documentId,
          verification_notes: 'Verified after Voter ID API check',
          verified_by_employee_id: employeeData?.id || user?.id
        }
      });

      if (error) {
        console.error('VoterIdDetailsDialog - Edge function error:', error);
        throw error;
      }

      if (data?.success) {
        // No toaster for approve action in detail dialog
        onOpenChange(false);
        onVerificationUpdate?.();
      } else {
        throw new Error(data?.error || 'Failed to approve document');
      }
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Failed to approve document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!documentId) return;
    
    // If reject form is not shown, show it first
    if (!showRejectForm) {
      setShowRejectForm(true);
      return;
    }
    
    // If reject form is shown but no reason provided, don't proceed
    if (!rejectReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejecting this document.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsRejecting(true);
      
      // Call the voter-verification edge function directly with reject_reason
      const { data, error } = await supabase.functions.invoke('voter-verification', {
        body: {
          action: 'reject',
          documentId: documentId,
          verification_notes: rejectReason,
          verified_by_employee_id: employeeData?.id || user?.id,
          reject_reason: rejectReason
        }
      });

      if (error) {
        console.error('VoterIdDetailsDialog - Edge function error:', error);
        throw error;
      }

      if (data?.success) {
        // No toaster for reject action in detail dialog
        onOpenChange(false);
        onVerificationUpdate?.();
      } else {
        throw new Error(data?.error || 'Failed to reject document');
      }
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
      setShowRejectForm(false);
      setRejectReason('');
    }
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectReason('');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Voter ID Verification Details</span>
          </DialogTitle>
          <DialogDescription>
            Details retrieved from voter ID verification service
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] rounded-md border">
          {(isSuccess && Object.keys(voterInfo).length > 0) ? (
            <div className="p-4 space-y-6">
              {profileImageSrc && (
                <div className="flex justify-center">
                  <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img 
                      src={profileImageSrc} 
                      alt="Voter Profile" 
                      className="w-32 h-32 object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}
              {/* Error message for failed verification */}
              {!isSuccess && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200">
                  <div className="flex items-center text-red-700 text-sm">
                    <X className="h-4 w-4 mr-2" />
                    <span>Verification failed: {voterIdDetails?.message || "Unknown error"}</span>
                  </div>
                </div>
              )}

              {/* Personal Information Card */}
              {getPersonalFields().length > 0 && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {getPersonalFields().map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="text-sm font-medium text-gray-500">
                          {formatFieldName(key)}
                        </div>
                        <div className="font-medium">
                          {String(value)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Address Information Card */}
              {getAddressFields().length > 0 && (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Address & Constituency Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {getAddressFields().map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="text-sm font-medium text-gray-500">
                          {formatFieldName(key)}
                        </div>
                        <div className="font-medium">
                          {String(value)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Additional Fields Table */}
              {getAdditionalFields().length > 0 && (
                <div className="mt-6">
                  <h3 className="text-base font-semibold mb-3">Additional Details</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/3 font-semibold">Field</TableHead>
                        <TableHead className="font-semibold">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAdditionalFields().map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">
                            {formatFieldName(key)}
                          </TableCell>
                          <TableCell>
                            {String(value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Document ID Footer */}
              <div className="text-xs text-gray-500 pt-4 border-t">
                Document ID: {documentId || 'N/A'}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <X className="h-8 w-8 text-amber-500" />
                <p className="text-lg text-red-500">
                  {!isSuccess ? 'Verification failed' : 'No data available'}
                </p>
                <p className="text-gray-600 mt-2">
                  {voterIdDetails?.message || "No verification details available"}
                </p>
              </div>
              <div className="text-xs text-gray-500 pt-4 border-t mt-4">
                Document ID: {documentId || 'N/A'}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Reject Reason Form */}
        {showRejectForm && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="rejectReason" className="text-sm font-medium">
                Reason for reject <span className="text-red-500">*</span>
              </Label>
              <TextareaWithVoice
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this document..."
                className="mt-1 min-h-[80px]"
                maxLength={200}
                required
              />
              {rejectReason.length > 0 && (
                <div className="text-xs text-muted-foreground text-right mt-1">
                  {rejectReason.length}/200 characters
                </div>
              )}
            </div>
          </div>
        )}

        {!readOnly && (
        <DialogFooter className="flex gap-3 pt-4 border-t">
          {showRejectForm ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelReject}
                disabled={isRejecting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || !rejectReason.trim()}
                className="flex-1"
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Confirm Reject
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isRejecting || isApproving}
                className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Reject
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isApproving || isRejecting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoterIdDetailsDialog;
