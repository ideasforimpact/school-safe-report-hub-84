
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (method: 'api' | 'manual') => void;
  onReject: () => void;
  isVerifying: boolean;
  documentType?: string;
  documentId?: string;
  documentNumber?: string;
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({
  open,
  onOpenChange,
  onVerify,
  onReject,
  isVerifying,
  documentType = '',
  documentId = '',
  documentNumber = ''
}) => {
  const { toast } = useToast();
  const isAadhar = documentType === 'aadhar';
  const isPan = documentType === 'pan';
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [cooldownTimerId, setCooldownTimerId] = useState<number | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isPanVerifying, setIsPanVerifying] = useState(false);

  // Logging OTP state for debugging
  useEffect(() => {
    console.info("OTP state:", {
      otp,
      otpLength: otp.length,
      isOtpComplete: otp.length === 6,
      hasTxnId: !!txnId,
      isVerifying
    });
  }, [otp, txnId, isVerifying]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerId !== null) {
        clearInterval(cooldownTimerId);
      }
    };
  }, [cooldownTimerId]);

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setShowOtpInput(false);
      setOtp("");
      setTxnId(null);
      setClientId(null);
      setIsRequestingOtp(false);
      setIsVerifyingOtp(false);
      setIsPanVerifying(false);
      if (cooldownTimerId !== null) {
        clearInterval(cooldownTimerId);
        setCooldownTimerId(null);
      }
      setCooldownSeconds(null);
    }
  }, [open]);

  const startCooldownTimer = (seconds: number) => {
    console.info("Starting cooldown timer with seconds:", seconds, "current time:", new Date().toISOString());
    setCooldownSeconds(seconds);
    
    // Clear any existing timer
    if (cooldownTimerId !== null) {
      clearInterval(cooldownTimerId);
    }
    
    // Start new timer
    const timerId = window.setInterval(() => {
      setCooldownSeconds(prevSeconds => {
        if (prevSeconds === null || prevSeconds <= 1) {
          clearInterval(timerId);
          setCooldownTimerId(null);
          return null;
        }
        return prevSeconds - 1;
      });
    }, 1000);
    
    setCooldownTimerId(timerId);
  };

  // Separate handler for PAN API verification
  const handlePanApiVerification = async () => {
    setIsPanVerifying(true);
    
    try {
      console.log("Initiating PAN verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('pan-verification', {
        body: {
          action: 'apiVerify',
          documentId,
          documentNumber
        }
      });
      
      console.log("PAN verification response:", data, error);
      
      if (error) {
        console.error('Error verifying PAN:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to verify PAN. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      if (data.success) {
        toast({
          title: "PAN Verified",
          description: data.message || "PAN has been successfully verified with government database.",
        });
        onVerify('api');
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "PAN verification failed. Please try manual verification.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Exception in handlePanApiVerification:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to verify PAN",
        variant: "destructive"
      });
    } finally {
      setIsPanVerifying(false);
    }
  };

  // Separate handler for PAN manual verification
  const handlePanManualVerification = async () => {
    setIsPanVerifying(true);
    
    try {
      console.log("Initiating manual PAN verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('pan-verification', {
        body: {
          action: 'manualVerify',
          documentId,
          verification_notes: 'Document manually verified by staff.'
        }
      });
      
      console.log("PAN manual verification response:", data, error);
      
      if (error) {
        console.error('Error manually verifying PAN:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to manually verify PAN. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "PAN Manually Verified",
        description: "The PAN card has been manually verified successfully.",
      });
      onVerify('manual');
    } catch (err: any) {
      console.error("Exception in handlePanManualVerification:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to manually verify PAN",
        variant: "destructive"
      });
    } finally {
      setIsPanVerifying(false);
    }
  };

  // Separate handler for PAN rejection
  const handlePanRejection = async () => {
    setIsPanVerifying(true);
    
    try {
      console.log("Rejecting PAN verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('pan-verification', {
        body: {
          action: 'reject',
          documentId,
          verification_notes: 'Document verification rejected by staff.'
        }
      });
      
      console.log("PAN rejection response:", data, error);
      
      if (error) {
        console.error('Error rejecting PAN:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to reject PAN. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "PAN Rejected",
        description: "The PAN card has been marked as failed verification.",
        variant: "destructive",
      });
      onReject();
    } catch (err: any) {
      console.error("Exception in handlePanRejection:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to reject PAN",
        variant: "destructive"
      });
    } finally {
      setIsPanVerifying(false);
    }
  };

  const handleApiClick = async () => {
    if (isAadhar) {
      if (!documentNumber) {
        toast({
          title: "Error",
          description: "Aadhar number is required for verification",
          variant: "destructive"
        });
        return;
      }
      
      // Set loading state
      setIsRequestingOtp(true);
      
      // Call the edge function to request OTP
      try {
        console.log("Sending OTP request for document ID:", documentId);
        
        const { data, error } = await supabase.functions.invoke('employee-verification', {
          method: 'POST',
          body: { 
            action: 'requestAadharOtp',
            documentId, 
            documentNumber // Send the plain document number
          }
        });
        
        console.log("OTP request response:", data, error);
        
        if (error) {
          console.error('Error requesting OTP:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to request OTP. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        if (data?.error) {
          if (data.cooldownRemaining) {
            // Handle cooldown period
            startCooldownTimer(data.cooldownRemaining);
          }
          
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
          return;
        }
        
        // Store transaction ID and client_id for OTP verification
        if (data?.txnId) {
          setTxnId(data.txnId);
          console.log("Transaction ID stored:", data.txnId);
        }
        
        if (data?.client_id) {
          setClientId(data.client_id);
          console.log("Client ID stored:", data.client_id);
        }
        
        setShowOtpInput(true);
        // Start a 3-minute countdown for OTP validity
        startCooldownTimer(3 * 60);
        toast({
          title: "OTP Sent",
          description: "A verification code has been sent to your registered mobile number"
        });
      } catch (err: any) {
        console.error("Exception in handleApiClick:", err);
        toast({
          title: "Error",
          description: err.message || "Failed to send OTP",
          variant: "destructive"
        });
      } finally {
        setIsRequestingOtp(false);
      }
    } else if (isPan) {
      // Use dedicated PAN verification handler
      await handlePanApiVerification();
    } else {
      // For other document types use the generic handler
      onVerify('api');
    }
  };

  const handleManualClick = async () => {
    if (isPan) {
      await handlePanManualVerification();
    } else {
      // For other document types including Aadhar
      onVerify('manual');
    }
  };

  const handleRejectClick = async () => {
    if (isPan) {
      await handlePanRejection();
    } else {
      // For other document types including Aadhar
      onReject();
    }
  };

  const handleOtpSubmit = async () => {
    console.log("handleOtpSubmit called - starting OTP verification process");
    
    if (otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive"
      });
      return;
    }
    
    // Start with setting the verifying state to true
    setIsVerifyingOtp(true);
    
    try {
      console.log("Submitting OTP verification with:", {
        otp,
        txnId,
        clientId,
        documentId
      });
      
      const requestBody: any = {
        action: 'verifyAadharOtp',
        documentId,
        otp
      };
      
      // Add client_id if available
      if (clientId) {
        requestBody.client_id = clientId;
      }
      
      // Add txnId if available, but don't require it
      if (txnId) {
        requestBody.txnId = txnId;
      }
      
      // Make the API call to verify OTP
      console.log("Invoking employee-verification edge function with requestBody:", requestBody);
      const { data, error } = await supabase.functions.invoke('employee-verification', {
        method: 'POST',
        body: requestBody
      });
      
      console.log("OTP verification response:", data, error);
      
      if (error) {
        console.error('Error verifying OTP:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to verify OTP. Please try again.",
          variant: "destructive",
        });
        setIsVerifyingOtp(false);
        return;
      }
      
      if (data?.error) {
        toast({
          title: "Verification Failed",
          description: data.error,
          variant: "destructive",
        });
        setIsVerifyingOtp(false);
        return;
      }
      
      toast({
        title: "Verification Successful",
        description: "Aadhar verification completed successfully"
      });
      onVerify('api');
      setShowOtpInput(false);
      setOtp("");
      setTxnId(null);
      setClientId(null);
      if (cooldownTimerId !== null) {
        clearInterval(cooldownTimerId);
        setCooldownTimerId(null);
      }
    } catch (err: any) {
      console.error("Exception in handleOtpSubmit:", err);
      toast({
        title: "Verification Failed",
        description: err.message || "Failed to verify OTP",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCancel = () => {
    setShowOtpInput(false);
    setOtp("");
    setTxnId(null);
    setClientId(null);
    if (cooldownTimerId !== null) {
      clearInterval(cooldownTimerId);
      setCooldownTimerId(null);
    }
    setCooldownSeconds(null);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Document</DialogTitle>
          <DialogDescription>
            Choose a verification method for this {documentType || 'document'}.
          </DialogDescription>
        </DialogHeader>
        {!showOtpInput ? (
          <div className="flex flex-col gap-4 py-4">
            <Button 
              variant="outline" 
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 justify-start"
              onClick={handleApiClick}
              disabled={isVerifying || cooldownSeconds !== null || isRequestingOtp || isPanVerifying}
            >
              {isRequestingOtp || (isPan && isPanVerifying) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              {isAadhar 
                ? cooldownSeconds !== null 
                  ? `Retry in ${formatTime(cooldownSeconds)}` 
                  : isRequestingOtp 
                    ? 'Requesting OTP...' 
                    : 'Verify via Aadhar API (Requires OTP)' 
                : isPan
                  ? isPanVerifying ? 'Verifying PAN...' : 'Verify via PAN API'
                  : 'Verify via API'
              }
              {cooldownSeconds === null && !isRequestingOtp && !isPanVerifying && (
                <span className="ml-auto text-xs text-blue-500 font-normal">
                  {isAadhar ? 'OTP verification' : isPan ? 'Surepass verification' : 'Automated check'}
                </span>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 justify-start"
              onClick={handleManualClick}
              disabled={isVerifying || isRequestingOtp || isPanVerifying}
            >
              {isPan && isPanVerifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              {isPan && isPanVerifying ? 'Processing...' : 'Verify Manually'}
              <span className="ml-auto text-xs text-purple-500 font-normal">Manual review completed</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-200 justify-start"
              onClick={handleRejectClick}
              disabled={isVerifying || isRequestingOtp || isPanVerifying}
            >
              {isPan && isPanVerifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              {isPan && isPanVerifying ? 'Processing...' : 'Reject Document'}
              <span className="ml-auto text-xs text-red-500 font-normal">Document verification failed</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter 6-digit OTP received</Label>
              <div className="flex justify-center py-4">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  OTP sent to registered mobile number
                </p>
                {cooldownSeconds !== null && (
                  <p className="text-sm text-amber-600 font-medium">
                    OTP expires in {formatTime(cooldownSeconds)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          {showOtpInput ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isVerifyingOtp}>
                Cancel
              </Button>
              <Button 
                onClick={handleOtpSubmit}
                disabled={isVerifyingOtp || otp.length !== 6}
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </>
          ) : (
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isVerifying || isRequestingOtp || isPanVerifying}
            >
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationDialog;
