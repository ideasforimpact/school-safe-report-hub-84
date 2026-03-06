
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
import { Card, CardContent } from '@/components/ui/card';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { FileText, User, Calendar, CreditCard, Fingerprint, CheckCircle, Loader2, X } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification/EmployeeVerificationContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PanDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panDetails: any;
  documentId?: string;
  onVerificationUpdate?: () => void;
  readOnly?: boolean;
}

const PanDetailsDialog: React.FC<PanDetailsDialogProps> = ({
  open,
  onOpenChange,
  panDetails,
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
  
  // Debug logging 
  // console.log('PanDetailsDialog - Props:', { open, documentId, onVerificationUpdate, panDetails });
  
  if (!panDetails || !panDetails.data) {
    return null;
  }

  const {
    data: {
      pan_number,
      full_name,
      masked_aadhaar,
      gender,
      dob,
      aadhaar_linked,
      status
    }
  } = panDetails;

  // Format date if available
  const formattedDob = dob ? format(new Date(dob), 'dd MMM yyyy') : 'Not available';
  
  // Render profile image if provided by provider
  const profileImageSrc = (() => {
    const value = (panDetails?.data as any)?.profile_image || (panDetails as any)?.profile_image;
    if (!value || typeof value !== 'string') return undefined;
    if (value.startsWith('http') || value.startsWith('https') || value.startsWith('data:')) return value;
    return `data:image/jpeg;base64,${value}`;
  })();

  const handleVerify = async () => {
    // console.log('PanDetailsDialog - handleVerify called, documentId:', documentId);
    if (!documentId) {
      // console.log('PanDetailsDialog - No documentId, exiting');
      return;
    }
    
    try {
      setIsApproving(true);
      
      // Call the pan-verification edge function directly
      const { data, error } = await supabase.functions.invoke('pan-verification', {
        body: {
          action: 'approveAfterApi',
          documentId: documentId,
          verification_notes: 'Verified after PAN API check',
          verified_by_employee_id: employeeData?.id || user?.id
        }
      });

      if (error) {
        console.error('PanDetailsDialog - Edge function error:', error);
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
      console.error('PanDetailsDialog - Verification error:', error);
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
    // console.log('PanDetailsDialog - handleReject called, documentId:', documentId);
    if (!documentId) {
      // console.log('PanDetailsDialog - No documentId, exiting');
      return;
    }
    
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
      
      // Call the pan-verification edge function directly with reject_reason
      const { data, error } = await supabase.functions.invoke('pan-verification', {
        body: {
          action: 'reject',
          documentId: documentId,
          verification_notes: rejectReason,
          verified_by_employee_id: employeeData?.id || user?.id,
          reject_reason: rejectReason
        }
      });

      if (error) {
        console.error('PanDetailsDialog - Edge function error:', error);
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
      console.error('PanDetailsDialog - Rejection error:', error);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-blue-600" />
            PAN Card Verification Details
          </DialogTitle>
          <DialogDescription>
            Governance verified data from the API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {profileImageSrc && (
            <div className="flex justify-center">
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <img 
                  src={profileImageSrc} 
                  alt="PAN Profile" 
                  className="w-32 h-32 object-cover"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>
          )}
          <Card className="border border-green-100 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Verification Status:</span>
                <div className="flex items-center gap-1 text-green-700 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  {status === 'valid' ? 'Valid PAN' : status}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">PAN Number:</span>
              <span className="text-sm ml-auto font-mono">{pan_number}</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Full Name:</span>
              <span className="text-sm ml-auto">{full_name}</span>
            </div>
            
            {gender && (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Gender:</span>
                <span className="text-sm ml-auto">{gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Date of Birth:</span>
              <span className="text-sm ml-auto">{formattedDob}</span>
            </div>
            
            {masked_aadhaar && (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <Fingerprint className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Aadhaar Status:</span>
                <div className="flex items-center ml-auto">
                  {aadhaar_linked && <CheckCircle className="h-4 w-4 text-green-600 mr-1" />}
                  <span className="text-sm">{masked_aadhaar}</span>
                </div>
              </div>
            )}
          </div>
        </div>

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
                onClick={() => {
                  // console.log('PanDetailsDialog - Reject button clicked');
                  handleReject();
                }}
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
                onClick={() => {
                  // console.log('PanDetailsDialog - Approve button clicked');
                  handleVerify();
                }}
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

export default PanDetailsDialog;
