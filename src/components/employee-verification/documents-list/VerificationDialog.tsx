
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (method: 'api' | 'manual') => Promise<void>;
  onReject: () => Promise<void>;
  isVerifying: boolean;
  documentType?: string;
  documentId?: string;
  documentNumber: string;
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({ 
  open, 
  onOpenChange,
  onVerify,
  onReject,
  isVerifying,
  documentType = '',
  documentId = '',
  documentNumber,
}) => {
  const [otp, setOtp] = useState('');
  const [isAadharOtpSent, setIsAadharOtpSent] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [isManualVerifying, setIsManualVerifying] = useState(false);
  const { toast } = useToast();

  const isAadhar = documentType?.toLowerCase().includes('aadhar');
  const isPAN = documentType?.toLowerCase().includes('pan');

  const handleManualVerify = async () => {
    setIsManualVerifying(true);
    console.log('Manual verification started for document:', documentId);
    
    try {
      // Fetch the "manual" status ID
      const { data: statusData, error: statusError } = await supabase
        .from('document_status')
        .select('id, name')
        .eq('name', 'manual')
        .single();
      
      if (statusError) {
        console.error('Error fetching manual status:', statusError);
        throw new Error('Failed to get manual status ID');
      }
      
      console.log('Found manual status ID:', statusData?.id);
      
      // Call the edge function directly
      const { data, error } = await supabase.functions.invoke('employee-documents', {
        method: 'PUT',
        body: { 
          documentId,
          verificationStatus: 'verified',
          verificationNotes: 'Document manually verified by administrator',
          documentStatusId: statusData?.id
        }
      });
      
      if (error) {
        console.error('Error during manual verification:', error);
        throw error;
      }
      
      console.log('Manual verification successful:', data);
      
      // Notify the parent component
      await onVerify('manual');
      
      toast({
        title: "Verification Completed",
        description: "Document has been manually verified successfully."
      });
    } catch (err) {
      console.error('Error in manual verification:', err);
      setError('Failed to complete manual verification. Please try again.');
      toast({
        title: "Verification Failed",
        description: "Could not complete manual verification.",
        variant: "destructive"
      });
    } finally {
      setIsManualVerifying(false);
    }
  };

  const handleAutoVerify = async () => {
    // This is for non-Aadhar documents that can be auto-verified
    // Each document type would have its own verification logic
    if (isPAN) {
      await handlePANVerification();
    } else {
      // Generic auto verification for other document types
      await onVerify('api');
    }
  };

  const handlePANVerification = async () => {
    setError(null);
    setIsVerifyingOtp(true);
    try {
      // Call the PAN verification endpoint
      await onVerify('api');
    } catch (err) {
      setError('PAN verification failed. Please try manual verification.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleRequestAadharOtp = useCallback(async () => {
    if (!documentNumber) {
      setError('Aadhar number is required for verification');
      return;
    }

    setIsRequestingOtp(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('employee-documents', {
        method: 'POST',
        body: { 
          action: 'requestAadharOtp',
          documentNumber
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setIsAadharOtpSent(true);
        setTxnId(data.txnId);
        toast({
          title: "OTP Sent",
          description: "OTP has been sent to the registered mobile number."
        });
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error requesting OTP:', err);
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRequestingOtp(false);
    }
  }, [documentNumber, toast]);

  const handleVerifyAadharOtp = useCallback(async () => {
    if (!otp || !txnId) {
      setError('OTP is required');
      return;
    }

    setIsVerifyingOtp(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('employee-documents', {
        method: 'POST',
        body: { 
          action: 'verifyAadharOtp',
          otp,
          txnId,
          documentId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Verification Successful",
          description: "Aadhar has been successfully verified."
        });
        onOpenChange(false);
      } else {
        throw new Error(data.message || 'OTP verification failed');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err instanceof Error ? err.message : 'OTP verification failed');
      toast({
        title: "Error",
        description: "OTP verification failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [otp, txnId, documentId, onOpenChange, toast]);

  const renderVerificationOptions = () => {
    if (isAadhar) {
      if (isAadharOtpSent) {
        return (
          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="border rounded-md w-full px-3 py-2"
                placeholder="Enter 6-digit OTP"
                disabled={isVerifyingOtp}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the OTP sent to the registered mobile number
              </p>
            </div>
            <Button 
              onClick={handleVerifyAadharOtp} 
              disabled={isVerifyingOtp || !otp}
              className="w-full"
            >
              {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </div>
        );
      }

      return (
        <div className="space-y-4 mt-4">
          <p className="text-sm">
            To verify this Aadhar document, we will send an OTP to the registered mobile number.
          </p>
          <Button 
            onClick={handleRequestAadharOtp} 
            disabled={isRequestingOtp}
            className="w-full"
          >
            {isRequestingOtp ? 'Sending OTP...' : 'Send OTP'}
          </Button>
          <div className="flex justify-center">
            <Button 
              variant="ghost"
              onClick={handleManualVerify}
              disabled={isManualVerifying || isVerifying}
              className="text-sm"
            >
              {isManualVerifying ? 'Verifying...' : 'Manually Verify Document'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 mt-4">
        <div className="space-y-2">
          <p className="text-sm">Please select verification method:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={handleAutoVerify}
              disabled={isVerifying || isManualVerifying}
              className="justify-start"
            >
              <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
              Auto Verify
            </Button>
            <Button 
              variant="outline" 
              onClick={handleManualVerify}
              disabled={isVerifying || isManualVerifying}
              className="justify-start"
            >
              <ShieldCheck className="h-4 w-4 mr-2 text-blue-500" />
              Manual Verify
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify {documentType}</DialogTitle>
          <DialogDescription>
            Choose how you want to verify this document
          </DialogDescription>
        </DialogHeader>

        <div>
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {documentNumber && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Document Number</p>
              <p className="font-medium">{documentNumber}</p>
            </div>
          )}
          
          {renderVerificationOptions()}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button 
            type="button" 
            variant="destructive" 
            onClick={onReject}
            disabled={isVerifying || isRequestingOtp || isVerifyingOtp || isManualVerifying}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="mt-2 sm:mt-0"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationDialog;
