
import React, { useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
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
import { toast } from '@/hooks/use-toast';

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
  const isAadhar = documentType?.toLowerCase() === 'aadhar';
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showManualConfirmation, setShowManualConfirmation] = useState(false);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  const [showApiConfirmation, setShowApiConfirmation] = useState(false);
  const [otp, setOtp] = useState("");

  const handleAadharApiClick = () => {
    if (isAadhar) {
      setShowOtpInput(true);
      resetConfirmationStates();
    } else {
      // For non-Aadhar documents, show API confirmation screen
      setShowApiConfirmation(true);
      resetConfirmationStates(true);
    }
  };
  
  const handleManualVerifyClick = () => {
    setShowManualConfirmation(true);
    resetConfirmationStates();
  };

  const handleRejectClick = () => {
    setShowRejectConfirmation(true);
    resetConfirmationStates();
  };

  // Helper to reset all confirmation states
  const resetConfirmationStates = (keepApiConfirmation = false) => {
    if (!keepApiConfirmation) {
      setShowApiConfirmation(false);
    }
    setShowOtpInput(false);
    setShowManualConfirmation(false);
    setShowRejectConfirmation(false);
  };

  const handleOtpSubmit = () => {
    if (otp.length === 4) {
      onVerify('api');
      resetConfirmationStates();
      setOtp("");
      toast({
        title: "Verification submitted",
        description: "The document verification has been submitted via OTP."
      });
    }
  };

  const handleManualConfirm = () => {
    onVerify('manual');
    resetConfirmationStates();
    toast({
      title: "Manual verification completed",
      description: "The document has been manually verified."
    });
  };

  const handleApiConfirm = () => {
    onVerify('api');
    resetConfirmationStates();
    toast({
      title: "API verification initiated",
      description: "The document is being verified via API."
    });
  };

  const handleRejectConfirm = () => {
    onReject();
    resetConfirmationStates();
    toast({
      title: "Document rejected",
      description: "The document has been marked as rejected."
    });
  };

  const handleCancel = () => {
    resetConfirmationStates();
    setOtp("");
  };

  // Check if we're showing any confirmation screen
  const isShowingConfirmation = showOtpInput || showManualConfirmation || showRejectConfirmation || showApiConfirmation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Document</DialogTitle>
          <DialogDescription>
            Choose a verification method for this {documentType || 'document'}.
          </DialogDescription>
        </DialogHeader>
        
        {!isShowingConfirmation ? (
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
              onClick={handleManualVerifyClick}
              disabled={isVerifying}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Verify Manually
              <span className="ml-auto text-xs text-purple-500 font-normal">Manual review completed</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-200 justify-start"
              onClick={handleRejectClick}
              disabled={isVerifying}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Reject Document
              <span className="ml-auto text-xs text-red-500 font-normal">Document verification failed</span>
            </Button>
          </div>
        ) : showOtpInput ? (
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
        ) : showManualConfirmation ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-4 text-center">
              <p className="text-base text-purple-700">
                Are you sure you want to manually verify this document?
              </p>
              <p className="text-sm text-muted-foreground">
                Manual verification confirms that you have physically inspected the document and found it valid.
              </p>
            </div>
          </div>
        ) : showRejectConfirmation ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-4 text-center">
              <p className="text-base text-red-700">
                Are you sure you want to reject this document?
              </p>
              <p className="text-sm text-muted-foreground">
                This will mark the document as failed verification and may affect the employee's verification status.
              </p>
            </div>
          </div>
        ) : showApiConfirmation && (
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-4 text-center">
              <p className="text-base text-blue-700">
                Are you sure you want to verify this document via API?
              </p>
              <p className="text-sm text-muted-foreground">
                API verification will check this document against official records automatically.
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
          ) : showManualConfirmation ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleManualConfirm}
              >
                Confirm
              </Button>
            </>
          ) : showRejectConfirmation ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejectConfirm}
              >
                Reject
              </Button>
            </>
          ) : showApiConfirmation ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleApiConfirm}
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
