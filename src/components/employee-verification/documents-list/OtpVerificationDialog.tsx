
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OtpVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: VerificationDocument;
  onVerificationComplete: () => void;
}

const OtpVerificationDialog: React.FC<OtpVerificationDialogProps> = ({
  isOpen,
  onClose,
  document,
  onVerificationComplete
}) => {
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [cooldownInterval, setCooldownInterval] = useState<number | null>(null);
  const { toast } = useToast();

  const handleRequestOtp = async () => {
    setIsRequestingOtp(true);
    try {
      console.log('Sending OTP request for document ID:', document.id);
      
      const { data, error } = await supabase.functions.invoke('employee-verification/request-aadhar-otp', {
        method: 'POST',
        body: { 
          documentId: document.id,
          documentNumber: document.documentNumber // Send the plain document number
        }
      });
      
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
          setCooldownRemaining(data.cooldownRemaining);
          
          // Set up an interval to count down
          if (cooldownInterval) window.clearInterval(cooldownInterval);
          const interval = window.setInterval(() => {
            setCooldownRemaining(prev => {
              if (prev <= 1) {
                window.clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          setCooldownInterval(interval as unknown as number);
        }
        
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "An OTP has been sent to the registered mobile number.",
      });
    } catch (err) {
      console.error('Exception in requestOtp:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifyingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('employee-verification/verify-aadhar-otp', {
        method: 'POST',
        body: { 
          documentId: document.id,
          otp
        }
      });
      
      if (error) {
        console.error('Error verifying OTP:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to verify OTP. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      if (data.error) {
        toast({
          title: "Verification Failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Verification Successful",
        description: "Aadhar has been successfully verified.",
      });
      
      onVerificationComplete();
    } catch (err) {
      console.error('Exception in verifyOtp:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Clean up interval on unmount
  React.useEffect(() => {
    return () => {
      if (cooldownInterval) {
        window.clearInterval(cooldownInterval);
      }
    };
  }, [cooldownInterval]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Aadhar Verification
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Verify this Aadhar document by sending an OTP to the registered mobile number.</p>
          </div>
          
          {!otpSent ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="documentNumber">Aadhar Number</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="documentNumber" 
                    value={document.documentNumber || ''} 
                    className="flex-1"
                    disabled
                  />
                  <Button 
                    onClick={handleRequestOtp} 
                    disabled={isRequestingOtp || cooldownRemaining > 0}
                  >
                    {isRequestingOtp ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Send OTP'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="otp" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter the OTP sent to your mobile"
                    className="flex-1"
                  />
                  <Button onClick={handleVerifyOtp} disabled={isVerifyingOtp}>
                    {isVerifyingOtp ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Verify
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Didn't receive the OTP?{' '}
                <button 
                  onClick={handleRequestOtp} 
                  disabled={isRequestingOtp || cooldownRemaining > 0}
                  className="text-primary hover:underline focus:outline-none disabled:opacity-50"
                >
                  Resend
                  {cooldownRemaining > 0 ? ` (${cooldownRemaining}s)` : ''}
                </button>
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-start">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OtpVerificationDialog;
