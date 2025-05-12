
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';

interface OtpVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentNumber: string;
  onVerificationComplete: (success: boolean, message: string) => void;
}

const OtpVerificationDialog: React.FC<OtpVerificationDialogProps> = ({
  open,
  onOpenChange,
  documentId,
  documentNumber,
  onVerificationComplete,
}) => {
  const [otp, setOtp] = useState('');
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    if (!documentNumber) {
      setError('Aadhar number is required for verification');
      return;
    }

    setError(null);
    setRequestingOtp(true);

    try {
      const { data, error: requestError } = await supabase.functions.invoke('employee-documents', {
        method: 'POST',
        body: {
          action: 'requestAadharOtp',
          documentNumber
        }
      });

      if (requestError) {
        throw new Error(requestError.message || 'Failed to request OTP');
      }

      if (data?.success) {
        setOtpRequested(true);
        setTxnId(data.txnId);
      } else {
        throw new Error(data?.message || 'OTP request failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter a valid OTP');
      return;
    }

    if (!txnId) {
      setError('Transaction ID not found, please request OTP again');
      return;
    }

    setError(null);
    setVerifyingOtp(true);

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('employee-documents', {
        method: 'POST',
        body: {
          action: 'verifyAadharOtp',
          otp,
          txnId,
          documentId
        }
      });

      if (verifyError) {
        throw new Error(verifyError.message || 'Failed to verify OTP');
      }

      if (data?.success) {
        onVerificationComplete(true, 'Aadhar verified successfully');
        onOpenChange(false);
        // Reset state for future use
        setOtp('');
        setOtpRequested(false);
        setTxnId(null);
      } else {
        throw new Error(data?.message || 'OTP verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleClose = () => {
    setOtp('');
    setOtpRequested(false);
    setTxnId(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aadhar Verification</DialogTitle>
          <DialogDescription>
            {!otpRequested
              ? 'Request an OTP to be sent to the registered mobile number linked with this Aadhar.'
              : 'Enter the 6-digit OTP sent to your registered mobile number.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 p-3 rounded-md border border-red-200 flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-4 py-4">
          {!otpRequested ? (
            <Button
              onClick={handleRequestOtp}
              disabled={requestingOtp || !documentNumber}
              className="w-full"
            >
              {requestingOtp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Request OTP
            </Button>
          ) : (
            <>
              <div className="flex flex-col items-center space-y-2">
                <p className="text-sm text-gray-500">Enter the 6-digit verification code</p>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  render={({ slots }) => (
                    <InputOTPGroup>
                      {slots.map((slot, index) => (
                        <InputOTPSlot key={index} {...slot} />
                      ))}
                    </InputOTPGroup>
                  )}
                />
              </div>

              <div className="flex flex-col w-full gap-2">
                <Button
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otp.length < 6}
                  className="w-full"
                >
                  {verifyingOtp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Verify OTP
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRequestOtp}
                  disabled={requestingOtp}
                  className="w-full"
                >
                  {requestingOtp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Resend OTP
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OtpVerificationDialog;
