
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, X, CheckCircle } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification/EmployeeVerificationContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DrivingLicenseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licenseDetails: any;
  documentId?: string;
  onVerificationUpdate?: () => void;
  readOnly?: boolean;
}

const DrivingLicenseDetailsDialog: React.FC<DrivingLicenseDetailsDialogProps> = ({
  open,
  onOpenChange,
  licenseDetails,
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
  // Extract relevant information from the driving license response
  const data = licenseDetails?.data || {};
  const isSuccessful = licenseDetails?.success && licenseDetails?.status_code === 200;
  
  // Prepare profile image source supporting URL or raw base64 string
  const profileImageSrc = (() => {
    const value = (data as any)?.profile_image || (data as any)?.photo || (data as any)?.image || (data as any)?.image_url;
    if (!value || typeof value !== 'string') return undefined;
    if (value.startsWith('http') || value.startsWith('https') || value.startsWith('data:')) return value;
    return `data:image/jpeg;base64,${value}`;
  })();
  
  // Comprehensive debugging logs
  // console.log('DrivingLicenseDetailsDialog - Dialog open state:', open);
  // console.log('DrivingLicenseDetailsDialog - Document ID:', documentId);
  // console.log('DrivingLicenseDetailsDialog - Full license details:', licenseDetails);
  // console.log('DrivingLicenseDetailsDialog - Extracted data:', data);
  // console.log('DrivingLicenseDetailsDialog - Is successful:', isSuccessful);
  // console.log('DrivingLicenseDetailsDialog - Data keys:', Object.keys(data));
  
  useEffect(() => {
    // console.log('DrivingLicenseDetailsDialog - Dialog mounted/updated with open:', open);
    
    if (open) {
      // console.log('DrivingLicenseDetailsDialog - Dialog is now open');
    }
    
    return () => {
      // console.log('DrivingLicenseDetailsDialog - Dialog unmounting');
    };
  }, [open]);

  const handleVerify = async () => {
    if (!documentId) {
      toast({
        title: "Error",
        description: "Document ID is missing. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsApproving(true);
      
      // Call the driving-license edge function directly
      const { data, error } = await supabase.functions.invoke('driving-license', {
        body: {
          action: 'approveAfterApi',
          documentId: documentId,
          verification_notes: 'Verified after Driving License API check',
          verified_by_employee_id: employeeData?.id || user?.id
        }
      });

      if (error) {
        console.error('DrivingLicenseDetailsDialog - Edge function error:', error);
        // Show user-friendly error message
        const errorMessage = error.message || 'Network error occurred. Please check your connection and try again.';
        toast({
          title: "Approval Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Approval Successful",
          description: data.message || "Driving License has been approved successfully.",
          variant: "default",
        });
        onOpenChange(false);
        onVerificationUpdate?.();
      } else {
        // Show user-friendly error message from the response
        const errorMessage = data?.error || 'Failed to approve document. Please try again.';
        const errorCode = data?.errorCode;
        
        // Provide more specific error messages based on error code
        let userFriendlyMessage = errorMessage;
        if (errorCode === 'MISSING_DOCUMENT_ID') {
          userFriendlyMessage = 'Document ID is missing. Please refresh the page and try again.';
        } else if (errorCode === 'MISSING_EMPLOYEE_ID') {
          userFriendlyMessage = 'Your user information is missing. Please log out and log back in, then try again.';
        } else if (errorCode === 'DOCUMENT_NOT_FOUND') {
          userFriendlyMessage = 'Document not found. It may have been deleted. Please refresh the page.';
        } else if (errorCode === 'UPDATE_FAILED') {
          userFriendlyMessage = 'Failed to update document status. Please try again in a moment.';
        }
        
        toast({
          title: "Approval Failed",
          description: userFriendlyMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('DrivingLicenseDetailsDialog - Exception:', error);
      toast({
        title: "Approval Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
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
      
      // Call the driving-license edge function directly with reject_reason
      const { data, error } = await supabase.functions.invoke('driving-license', {
        body: {
          action: 'reject',
          documentId: documentId,
          verification_notes: rejectReason,
          verified_by_employee_id: employeeData?.id || user?.id,
          reject_reason: rejectReason
        }
      });

      if (error) {
        console.error('DrivingLicenseDetailsDialog - Edge function error:', error);
        const errorMessage = error.message || 'Network error occurred. Please check your connection and try again.';
        toast({
          title: "Rejection Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Rejection Successful",
          description: data.message || "Driving License has been rejected successfully.",
          variant: "default",
        });
        onOpenChange(false);
        onVerificationUpdate?.();
      } else {
        // Show user-friendly error message from the response
        const errorMessage = data?.error || 'Failed to reject document. Please try again.';
        const errorCode = data?.errorCode;
        
        // Provide more specific error messages based on error code
        let userFriendlyMessage = errorMessage;
        if (errorCode === 'MISSING_DOCUMENT_ID') {
          userFriendlyMessage = 'Document ID is missing. Please refresh the page and try again.';
        } else if (errorCode === 'DOCUMENT_NOT_FOUND') {
          userFriendlyMessage = 'Document not found. It may have been deleted. Please refresh the page.';
        } else if (errorCode === 'UPDATE_FAILED') {
          userFriendlyMessage = 'Failed to update document status. Please try again in a moment.';
        }
        
        toast({
          title: "Rejection Failed",
          description: userFriendlyMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('DrivingLicenseDetailsDialog - Rejection error:', error);
      const errorMessage = error.message || 'Failed to reject document. Please try again.';
      toast({
        title: "Rejection Failed",
        description: errorMessage,
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Driving License Details</span>
          </DialogTitle>
          <DialogDescription>
            Details retrieved from government database for driving license {data?.license_number || licenseDetails?.license_number || 'verification'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] rounded-md border">
          {(isSuccessful || Object.keys(data).length > 0) ? (
            <div className="p-4">
              {profileImageSrc && (
                <div className="flex justify-center mb-4">
                  <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img 
                      src={profileImageSrc} 
                      alt="Driving License Profile" 
                      className="w-32 h-32 object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Field</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(data)
                    .filter(([key]) => ![
                      'profile_image', 'photo', 'image', 'image_url',
                      'client_id', 'has_image', 'less_info', 'doi', 'current_status', 'additional_check'
                    ].includes(key))
                    .map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
                        <TableCell>{String(value)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-lg text-red-500">Verification failed or no data available</p>
              <p className="text-gray-600 mt-2">
                {licenseDetails?.message || "No verification details available"}
              </p>
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
              <Textarea
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

export default DrivingLicenseDetailsDialog;
