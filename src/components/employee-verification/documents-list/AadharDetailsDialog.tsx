
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, User, Calendar, CheckCircle, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useEmployeeVerification } from '@/contexts/employee-verification/EmployeeVerificationContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AadharAddress {
  country?: string;
  state?: string;
  dist?: string;
  po?: string;
  loc?: string;
  vtc?: string;
  subdist?: string;
  street?: string;
  house?: string;
  landmark?: string;
  zip?: string;
}

// DigiLocker response format
interface DigiLockerAddress {
  country?: string;
  dist?: string;
  state?: string;
  po?: string;
  house?: string;
  loc?: string;
  vtc?: string;
  subdist?: string;
  street?: string;
  landmark?: string;
}

interface DigiLockerAadhaarData {
  full_name?: string;
  care_of?: string;
  dob?: string;
  yob?: string;
  zip?: string;
  profile_image?: string;
  gender?: string;
  masked_aadhaar?: string;
  full_address?: string;
  father_name?: string;
  address?: DigiLockerAddress;
}

interface DigiLockerResponse {
  data?: {
    client_id?: string;
    digilocker_metadata?: {
      name?: string;
      gender?: string;
      dob?: string;
    };
    aadhaar_xml_data?: DigiLockerAadhaarData;
    xml_url?: string;
  };
  status_code?: number;
  success?: boolean;
  message?: string;
  message_code?: string;
}

interface AadharResponse {
  data?: {
    full_name?: string;
    aadhaar_number?: string;
    dob?: string;
    gender?: string;
    address?: AadharAddress;
    care_of?: string;
    profile_image?: string;
    has_image?: boolean;
    mobile_verified?: boolean;
  };
  success?: boolean;
  message?: string;
  message_code?: string;
}

interface AadharDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aadharDetails: {
    timestamp?: string;
    action?: string;
    response?: AadharResponse | DigiLockerResponse;
  } | null;
  documentId?: string;
  onVerificationUpdate?: () => void;
  readOnly?: boolean;
}

const AadharDetailsDialog: React.FC<AadharDetailsDialogProps> = ({
  open,
  onOpenChange,
  aadharDetails,
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
  console.log('AadharDetailsDialog - aadharDetails:', aadharDetails);
  console.log('AadharDetailsDialog - documentId:', documentId);
  console.log('AadharDetailsDialog - onVerificationUpdate:', onVerificationUpdate);
  
  // Allow rendering when provider returns payload at root (not nested under .data)
  if (!aadharDetails?.response) {
    return null;
  }

  // Determine if this is a DigiLocker response or old format response
  const isDigiLockerResponse = (response: any): response is DigiLockerResponse => {
    return response.data?.aadhaar_xml_data !== undefined;
  };

  const response = aadharDetails.response as any;
  let data: any;
  let address: any = {};
  let formattedAddress = '';

  // Many providers nest the payload as response.data.data; normalize once here
  const payload = (response && (response.data?.data ?? response.data ?? response)) || {};

  if (isDigiLockerResponse(response)) {
    // Handle DigiLocker response format
    data = {
      full_name: response.data?.aadhaar_xml_data?.full_name || response.data?.digilocker_metadata?.name,
      aadhaar_number: response.data?.aadhaar_xml_data?.masked_aadhaar,
      dob: response.data?.aadhaar_xml_data?.dob || response.data?.digilocker_metadata?.dob,
      gender: response.data?.aadhaar_xml_data?.gender || response.data?.digilocker_metadata?.gender,
      care_of: response.data?.aadhaar_xml_data?.father_name || response.data?.aadhaar_xml_data?.care_of,
      profile_image: response.data?.aadhaar_xml_data?.profile_image,
      mobile_verified: true // Assume verified if from DigiLocker
    };
    
    // Use full_address if available, otherwise construct from address object
    if (response.data?.aadhaar_xml_data?.full_address) {
      formattedAddress = response.data.aadhaar_xml_data.full_address;
    } else {
      address = response.data?.aadhaar_xml_data?.address || {};
      formattedAddress = [
        address.house,
        address.street,
        address.landmark,
        address.loc,
        address.vtc,
        address.subdist,
        address.dist,
        address.state,
        response.data?.aadhaar_xml_data?.zip,
        address.country,
      ]
        .filter(Boolean)
        .join(', ');
    }
  } else {
    // Handle Surepass submit-otp and other providers
    const raw = payload;
    data = {
      full_name: raw.full_name ?? raw.name ?? raw.fullName,
      aadhaar_number: raw.aadhaar_number ?? raw.masked_aadhaar ?? raw.aadhaar ?? raw.maskedAadhaar,
      dob: raw.dob ?? raw.date_of_birth ?? raw.yob,
      gender: raw.gender,
      care_of: raw.care_of ?? raw.father_name ?? raw.careOf,
      profile_image: raw.profile_image,
      mobile_verified: raw.mobile_verified ?? true,
      address: raw.address || {
        house: raw.house,
        street: raw.street,
        landmark: raw.landmark,
        loc: raw.loc,
        vtc: raw.vtc,
        subdist: raw.subdist,
        dist: raw.dist,
        state: raw.state,
        zip: raw.zip,
        country: raw.country,
      },
    };
    address = data.address || {};
    formattedAddress = [
      address.house,
      address.street,
      address.landmark,
      address.loc,
      address.vtc,
      address.subdist,
      address.dist,
      address.state,
      address.zip,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');
  }

  const verificationDate = aadharDetails.timestamp 
    ? format(new Date(aadharDetails.timestamp), 'PPP p') 
    : '';

  const verificationType = isDigiLockerResponse(response) ? 'DigiLocker' : 'government Aadhaar database';

  // Prepare profile image source supporting URL or raw base64 string
  const profileImageSrc = (() => {
    const value = data?.profile_image;
    if (!value || typeof value !== 'string') return undefined;
    if (value.startsWith('http') || value.startsWith('https') || value.startsWith('data:')) return value;
    // Assume raw base64 without prefix
    return `data:image/jpeg;base64,${value}`;
  })();

  const handleVerify = async () => {
    if (!documentId) return;
    
    try {
      setIsApproving(true);
      
      // Call the employee-verification edge function directly for Aadhar
      const { data, error } = await supabase.functions.invoke('employee-verification', {
        body: {
          action: 'manualVerify',
          documentId: documentId,
          verification_notes: 'Verified after Aadhar API check',
          verified_by_employee_id: employeeData?.id || user?.id
        }
      });

      if (error) {
        console.error('AadharDetailsDialog - Edge function error:', error);
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
      
      // Call the employee-verification edge function directly with reject_reason
      const { data, error } = await supabase.functions.invoke('employee-verification', {
        body: {
          action: 'reject',
          documentId: documentId,
          verification_notes: rejectReason,
          verified_by_employee_id: employeeData?.id || user?.id,
          reject_reason: rejectReason
        }
      });

      if (error) {
        console.error('AadharDetailsDialog - Edge function error:', error);
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
      <DialogContent 
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Aadhaar Verification Details</DialogTitle>
          <DialogDescription>
            Verified through {verificationType}
            {verificationDate ? ` on ${verificationDate}` : ''}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-1">
            {profileImageSrc && (
              <div className="flex justify-center mb-4">
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <img 
                    src={profileImageSrc} 
                    alt="Aadhaar Profile" 
                    className="w-32 h-32 object-cover"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900">Full Name</h4>
                <p className="text-base">{data.full_name || 'N/A'}</p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900">Aadhaar Number</h4>
                <p className="text-base">{data.aadhaar_number || 'N/A'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900">Date of Birth</h4>
                  <p className="text-base">{data.dob || 'N/A'}</p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900">Gender</h4>
                  <p className="text-base">{data.gender || 'N/A'}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900">Care of</h4>
                <p className="text-base">{data.care_of || 'N/A'}</p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900">Address</h4>
                <p className="text-base">{formattedAddress || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900">Mobile Verified</h4>
                  <p className="text-base">{data.mobile_verified ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700">Verification Method</h4>
              <p className="text-sm text-gray-600">{isDigiLockerResponse(response) ? 'DigiLocker API Verification' : 'Government Aadhaar API Verification'}</p>
            </div>
          </div>
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
          {/* Show buttons for DigiLocker verification results */}
          {aadharDetails && (
            <>
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
                    disabled={isRejecting || isApproving || !documentId}
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
                    disabled={isApproving || isRejecting || !documentId}
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
            </>
          )}
        </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AadharDetailsDialog;
