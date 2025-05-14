
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/components/ui/use-toast';
import { LoaderCircle } from 'lucide-react';

interface OtpVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentNumber: string;
  onVerificationComplete: () => void;
}

const OtpVerificationDialog: React.FC<OtpVerificationDialogProps> = ({
  open,
  onOpenChange,
  documentId,
  documentNumber,
  onVerificationComplete
}) => {
  const [otp, setOtp] = useState('');
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();

  const handleGenerateOtp = async () => {
    setIsGeneratingOtp(true);
    // Simulate API call to generate OTP
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setOtpSent(true);
      toast({
        title: "OTP Generated",
        description: "OTP has been sent to the registered mobile number.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate OTP. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid OTP.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify the document in your system
      await verifyDocument(documentId, "Verified through OTP authentication");
      
      toast({
        title: "Success",
        description: "Aadhar card verified successfully.",
      });
      
      onVerificationComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Verification Failed",
        description: "Could not verify the OTP. Please try again.",
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
          <DialogTitle>Aadhar OTP Verification</DialogTitle>
          <DialogDescription>
            Verify Aadhar card through OTP authentication
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <Label htmlFor="aadharNumber">Aadhar Number</Label>
            <Input 
              id="aadharNumber" 
              value={documentNumber} 
              disabled 
              className="mt-1"
            />
          </div>
          
          {!otpSent ? (
            <Button 
              onClick={handleGenerateOtp} 
              className="w-full"
              disabled={isGeneratingOtp}
            >
              {isGeneratingOtp ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Generating OTP...
                </>
              ) : (
                "Generate OTP"
              )}
            </Button>
          ) : (
            <>
              <div className="mb-4">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input 
                  id="otp" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)}
                  className="mt-1"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                />
                <p className="text-xs mt-1 text-gray-500">
                  OTP has been sent to the registered mobile number
                </p>
              </div>
              
              <Button 
                onClick={handleVerifyOtp} 
                className="w-full"
                disabled={isVerifyingOtp}
              >
                {isVerifyingOtp ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>
              
              <Button 
                variant="link" 
                className="w-full mt-2"
                onClick={handleGenerateOtp}
                disabled={isGeneratingOtp}
              >
                Resend OTP
              </Button>
            </>
          )}
        </div>
        
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isGeneratingOtp || isVerifyingOtp}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OtpVerificationDialog;
