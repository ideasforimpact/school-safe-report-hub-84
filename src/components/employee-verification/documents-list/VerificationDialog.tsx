
import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';

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
      if (cooldownTimerId !== null) {
        clearInterval(cooldownTimerId);
        setCooldownTimerId(null);
      }
      setCooldownSeconds(null);
    }
  }, [open]);

  const startCooldownTimer = (seconds: number) => {
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
      
      // Call the edge function to request OTP
      try {
        const response = await fetch(`/api/employee-verification/request-aadhar-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            documentId, 
            documentNumber 
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          // Handle rate limiting (cooldown period)
          if (response.status === 429 && errorData.cooldownRemaining) {
            startCooldownTimer(errorData.cooldownRemaining * 60);
            throw new Error(`Please wait ${errorData.cooldownRemaining} minutes before requesting another OTP`);
          }
          throw new Error(errorData.error || "Failed to send OTP");
        }
        
        const data = await response.json();
        
        if (data?.success) {
          setShowOtpInput(true);
          // Start a 3-minute countdown for OTP validity
          startCooldownTimer(3 * 60);
          toast({
            title: "OTP Sent",
            description: "A verification code has been sent to your registered mobile number"
          });
        } else {
          throw new Error(data?.error || data?.message || "Failed to send OTP");
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to send OTP",
          variant: "destructive"
        });
      }
    } else {
      onVerify('api');
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length === 6) {
      try {
        const response = await fetch(`/api/employee-verification/verify-aadhar-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            documentId, 
            otp 
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "OTP verification failed");
        }
        
        const data = await response.json();
        
        if (data?.success) {
          toast({
            title: "Verification Successful",
            description: "Aadhar verification completed successfully"
          });
          onVerify('api');
          setShowOtpInput(false);
          setOtp("");
          if (cooldownTimerId !== null) {
            clearInterval(cooldownTimerId);
            setCooldownTimerId(null);
          }
        } else {
          throw new Error(data?.error || data?.message || "OTP verification failed");
        }
      } catch (err: any) {
        toast({
          title: "Verification Failed",
          description: err.message || "Failed to verify OTP",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setShowOtpInput(false);
    setOtp("");
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
              disabled={isVerifying || cooldownSeconds !== null}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {isAadhar ? 'Verify via Aadhar API (Requires OTP)' : 'Verify via API'}
              {cooldownSeconds !== null && (
                <span className="ml-auto text-xs text-blue-500 font-normal">
                  Retry in {formatTime(cooldownSeconds)}
                </span>
              )}
              {cooldownSeconds === null && (
                <span className="ml-auto text-xs text-blue-500 font-normal">
                  {isAadhar ? 'OTP verification' : 'Automated check'}
                </span>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 justify-start"
              onClick={() => onVerify('manual')}
              disabled={isVerifying}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Verify Manually
              <span className="ml-auto text-xs text-purple-500 font-normal">Manual review completed</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-200 justify-start"
              onClick={onReject}
              disabled={isVerifying}
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
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleOtpSubmit}
                disabled={otp.length !== 6}
              >
                Verify
              </Button>
            </>
          ) : (
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isVerifying}
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
