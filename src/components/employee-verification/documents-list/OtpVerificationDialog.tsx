
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: VerificationDocument;
  onVerificationComplete?: () => void;
}

const OtpVerificationDialog: React.FC<OtpVerificationDialogProps> = ({
  open,
  onOpenChange,
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
        description: "Aadhar has been successfully verified.",
      });
      
      if (onVerificationComplete) {
        onVerificationComplete();
      }
      
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-primary" />
            Aadhar Verification
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            To verify this Aadhar card, we'll send an OTP to the mobile number registered with this Aadhar.
          </p>
          
          {otpSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input 
                  id="otp" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  placeholder="Enter the 6-digit OTP"
                  maxLength={6}
                />
              </div>
              
              <Button 
                onClick={handleVerifyOtp} 
                className="w-full"
                disabled={!otp || isVerifyingOtp}
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                Aadhar Number: <strong>{document.documentNumber}</strong>
              </p>
              
              <Button 
                onClick={handleRequestOtp} 
                className="w-full"
                disabled={isRequestingOtp || cooldownRemaining > 0}
              >
                {isRequestingOtp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : cooldownRemaining > 0 ? (
                  `Try again in ${cooldownRemaining} seconds`
                ) : (
                  'Send OTP'
                )}
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OtpVerificationDialog;
