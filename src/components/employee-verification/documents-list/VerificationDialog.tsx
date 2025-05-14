
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
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [cooldownTimerId, setCooldownTimerId] = useState<number | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

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

  const handleAadharApiClick = async () => {
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
        console.error("Exception in handleAadharApiClick:", err);
        toast({
          title: "Error",
          description: err.message || "Failed to send OTP",
          variant: "destructive"
        });
      } finally {
        setIsRequestingOtp(false);
      }
    } else {
      onVerify('api');
    }
  };

  const handleOtpSubmit = async () => {
    // Start with setting the verifying state to true
    setIsVerifyingOtp(true);
    
    if (!txnId) {
      toast({
        title: "Error",
        description: "Transaction ID is missing. Please request a new OTP.",
        variant: "destructive"
      });
      setIsVerifyingOtp(false);
      return;
    }
    
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
        otp,
        txnId
      };
      
      // Add client_id if available
      if (clientId) {
        requestBody.client_id = clientId;
      }
      
      // Make the API call to verify OTP
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
        return;
      }
      
      if (data?.error) {
        toast({
          title: "Verification Failed",
          description: data.error,
          variant: "destructive",
        });
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
              onClick={handleAadharApiClick}
              disabled={isVerifying || cooldownSeconds !== null || isRequestingOtp}
            >
              {isRequestingOtp ? (
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
                : 'Verify via API'
              }
              {cooldownSeconds === null && !isRequestingOtp && (
                <span className="ml-auto text-xs text-blue-500 font-normal">
                  {isAadhar ? 'OTP verification' : 'Automated check'}
                </span>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 justify-start"
              onClick={() => onVerify('manual')}
              disabled={isVerifying || isRequestingOtp}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Verify Manually
              <span className="ml-auto text-xs text-purple-500 font-normal">Manual review completed</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-200 justify-start"
              onClick={onReject}
              disabled={isVerifying || isRequestingOtp}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Reject Document
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
                disabled={isVerifyingOtp}
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
              disabled={isVerifying || isRequestingOtp}
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
