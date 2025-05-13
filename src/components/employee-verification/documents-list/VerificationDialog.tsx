
import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (method: 'api' | 'manual') => void;
  onReject: () => void;
  isVerifying: boolean;
  documentType?: string;
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({
  open,
  onOpenChange,
  onVerify,
  onReject,
  isVerifying,
  documentType = ''
}) => {
  const isAadhar = documentType === 'aadhar';
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");

  const handleAadharApiClick = () => {
    if (isAadhar) {
      setShowOtpInput(true);
    } else {
      onVerify('api');
    }
  };

  const handleOtpSubmit = () => {
    if (otp.length === 4) {
      onVerify('api');
      setShowOtpInput(false);
      setOtp("");
    }
  };

  const handleCancel = () => {
    setShowOtpInput(false);
    setOtp("");
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
              disabled={isVerifying}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {isAadhar ? 'Verify via Aadhar API (Requires OTP)' : 'Verify via API'}
              <span className="ml-auto text-xs text-blue-500 font-normal">
                {isAadhar ? 'OTP verification' : 'Automated check'}
              </span>
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
              <Label htmlFor="otp">Enter 4-digit OTP received</Label>
              <div className="flex justify-center py-4">
                <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                OTP sent to registered mobile number
              </p>
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
                disabled={otp.length !== 4}
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
