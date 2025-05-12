
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldCheck, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';
import { VerificationDocument } from '@/types/employeeVerification';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';

interface DocumentActionsProps {
  document: VerificationDocument;
  showVerifyButton?: boolean;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ document, showVerifyButton = true }) => {
  const [verifying, setVerifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);
  
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();

  const isAadhar = document.documentType === 'aadhar';

  const handleVerify = async (status: 'verified' | 'failed', method: 'api' | 'manual') => {
    // For Aadhar documents that need OTP verification
    if (isAadhar && method === 'api' && status === 'verified') {
      setShowOtpInput(true);
      setError(null);
      return;
    }
    
    setVerifying(true);
    try {
      // In a real app, this would call an API to verify the document
      setTimeout(() => {
        const notes = status === 'verified' 
          ? `Document ${method === 'api' ? 'automatically' : 'manually'} verified successfully.` 
          : 'Failed to verify document. Details do not match records.';
        
        verifyDocument(
          document.id, 
          status, 
          notes
        );
        
        toast({
          title: status === 'verified' ? 'Document Verified' : 'Verification Failed',
          description: status === 'verified' 
            ? `The document has been ${method === 'api' ? 'automatically' : 'manually'} verified successfully.` 
            : 'Document verification failed.',
        });
        setVerifying(false);
      }, 1500); // Simulate API delay
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during verification.',
        variant: 'destructive',
      });
      setVerifying(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!document.documentNumber) {
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
          documentNumber: document.documentNumber
        }
      });

      if (requestError) {
        throw new Error(requestError.message || 'Failed to request OTP');
      }

      if (data?.success) {
        setOtpRequested(true);
        setTxnId(data.txnId);
        toast({
          title: "OTP Sent",
          description: "OTP has been sent to the registered mobile number.",
        });
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
          documentId: document.id
        }
      });

      if (verifyError) {
        throw new Error(verifyError.message || 'Failed to verify OTP');
      }

      if (data?.success) {
        toast({
          title: "Verification Successful",
          description: "Aadhar verified successfully",
        });
        
        // Reset OTP state
        resetOtpState();
        // No need to manually update document state, the context will handle it
      } else {
        throw new Error(data?.message || 'OTP verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const resetOtpState = () => {
    setOtp('');
    setOtpRequested(false);
    setTxnId(null);
    setError(null);
    setShowOtpInput(false);
  };

  if (document.verificationStatus !== 'pending' || !showVerifyButton) {
    return null;
  }

  if (showOtpInput) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-sm">
          <h4 className="font-medium text-blue-700 mb-1">Aadhar OTP Verification</h4>
          <p className="text-blue-600 text-xs">
            {!otpRequested
              ? 'Request an OTP to be sent to the registered mobile number linked with this Aadhar.'
              : 'Enter the 6-digit OTP sent to your registered mobile number.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 p-3 rounded-md border border-red-200 flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-4 py-2">
          {!otpRequested ? (
            <Button
              onClick={handleRequestOtp}
              disabled={requestingOtp}
              className="w-full"
            >
              {requestingOtp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Request OTP
            </Button>
          ) : (
            <>
              <div className="flex flex-col items-center space-y-2 w-full">
                <p className="text-sm text-gray-500">Enter the 6-digit verification code</p>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  render={({ slots }) => (
                    <InputOTPGroup>
                      {slots.map((slot, i) => (
                        <InputOTPSlot key={i} {...slot} index={i} />
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

          <Button 
            variant="ghost"
            onClick={resetOtpState}
            className="flex items-center gap-1 text-gray-600"
            size="sm"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to verification options
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 w-full">
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">Auto Verification</p>
          <Button 
            variant="outline" 
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            onClick={() => handleVerify('verified', 'api')}
            disabled={verifying}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            {isAadhar ? 'Verify with OTP' : 'Verify API'}
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">Manual Verification</p>
          <Button 
            variant="outline" 
            className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
            onClick={() => handleVerify('verified', 'manual')}
            disabled={verifying}
          >
            <Shield className="h-4 w-4 mr-2" />
            Verify Manual
          </Button>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
        onClick={() => handleVerify('failed', 'manual')}
        disabled={verifying}
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Reject Document
      </Button>
    </div>
  );
};

export default DocumentActions;
