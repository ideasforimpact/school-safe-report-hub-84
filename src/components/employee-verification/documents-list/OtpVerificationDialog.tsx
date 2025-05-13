
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from "lucide-react";

interface OtpVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: () => void;
  documentId: string;
  documentNumber: string;
  txnId?: string;
}

const OtpVerificationDialog: React.FC<OtpVerificationDialogProps> = ({
  open,
  onOpenChange,
  onVerify,
  documentId,
  documentNumber,
  txnId
}) => {
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Log document information when dialog opens
  useEffect(() => {
    if (open) {
      console.log('OTP Verification Dialog opened with:', {
        documentId,
        documentNumber,
        txnId
      });
    }
  }, [open, documentId, documentNumber, txnId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length < 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Verifying OTP with:', {
        documentId,
        otp,
        txnId
      });
      
      const response = await fetch(`/api/employee-verification/verify-aadhar-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          documentId, 
          otp,
          ...(txnId ? { txnId } : {})
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }
      
      toast({
        title: "Success",
        description: "Aadhar verification completed successfully",
      });
      
      onVerify();
      onOpenChange(false);
    } catch (error) {
      console.error('OTP verification error:', error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "OTP verification failed",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Enter OTP for Aadhar Verification</DialogTitle>
            <DialogDescription>
              An OTP has been sent to the registered mobile number. Please enter it below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="otp" className="text-right">
                OTP
              </Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="col-span-3"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OtpVerificationDialog;
