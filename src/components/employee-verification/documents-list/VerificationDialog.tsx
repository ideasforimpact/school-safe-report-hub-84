import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const { toast: shadcnToast } = useToast();
  const isAadhar = documentType === 'aadhar';
  const isPan = documentType === 'pan';
  const isVoterId = documentType === 'voter_id';
  const isDrivingLicense = documentType === 'driving_license';
  const isBankAccount = documentType === 'bank_account';
  const isOther = documentType === 'other';
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [cooldownTimerId, setCooldownTimerId] = useState<number | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isPanVerifying, setIsPanVerifying] = useState(false);
  const [isVoterIdVerifying, setIsVoterIdVerifying] = useState(false);
  const [isDrivingLicenseVerifying, setIsDrivingLicenseVerifying] = useState(false);
  const [isBankAccountVerifying, setIsBankAccountVerifying] = useState(false);
  const [isAadharManualVerifying, setIsAadharManualVerifying] = useState(false);
  const [isOtherVerifying, setIsOtherVerifying] = useState(false);
  const [isOtherRejecting, setIsOtherRejecting] = useState(false);

  // Logging OTP state for debugging
  useEffect(() => {
    console.info("OTP state:", {
      otp,
      otpLength: otp.length,
      isOtpComplete: otp.length === 6,
      hasTxnId: !!txnId,
      isVerifying
    });
  }, [otp, txnId, isVerifying]);

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
      setTxnId(null);
      setClientId(null);
      setIsRequestingOtp(false);
      setIsVerifyingOtp(false);
      setIsPanVerifying(false);
      setIsVoterIdVerifying(false);
      setIsDrivingLicenseVerifying(false);
      setIsBankAccountVerifying(false);
      setIsOtherVerifying(false);
      setIsOtherRejecting(false);
      if (cooldownTimerId !== null) {
        clearInterval(cooldownTimerId);
        setCooldownTimerId(null);
      }
      setCooldownSeconds(null);
    }
  }, [open]);

  const startCooldownTimer = (seconds: number) => {
    console.info("Starting cooldown timer with seconds:", seconds, "current time:", new Date().toISOString());
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

  // Separate handler for Bank Account API verification
  const handleBankAccountApiVerification = async () => {
    setIsBankAccountVerifying(true);
    
    try {
      console.log("Initiating Bank Statement verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('bank-statement', {
        body: {
          action: 'apiVerify',
          documentId
        }
      });
      
      console.log("Bank Statement verification response:", data, error);
      
      if (error) {
        console.error('Error verifying Bank Statement:', error);
        toast.error("Bank Statement Verification Failed", {
          description: error.message || "Something went wrong during Bank Statement verification. Please try again."
        });
        return;
      }
      
      if (data?.success) {
        onVerify('api');
      } else {
        // Use the user-friendly error message from the API
        const errorMessage = data.error || "Bank Statement verification failed. Please try manual verification.";
        toast.error("Bank Statement Verification Failed", {
          description: errorMessage
        });
      }
    } catch (err: any) {
      console.error("Exception in handleBankAccountApiVerification:", err);
      toast.error("Bank Statement Verification Error", {
        description: "Something went wrong during Bank Statement verification. Please try again."
      });
    } finally {
      setIsBankAccountVerifying(false);
    }
  };

  // Separate handler for Bank Account manual verification
  const handleBankAccountManualVerification = async () => {
    setIsBankAccountVerifying(true);
    
    try {
      console.log("Initiating manual Bank Statement verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('bank-statement', {
        body: {
          action: 'manualVerify',
          documentId,
          verification_notes: 'Document manually verified by staff.'
        }
      });
      
      console.log("Bank Statement manual verification response:", data, error);
      
      if (error) {
        console.error('Error manually verifying Bank Statement:', error);
        toast.error("Verification Failed", {
          description: error.message || "Failed to manually verify Bank Statement. Please try again."
        });
        return;
      }
      
      onVerify('manual');
    } catch (err: any) {
      console.error("Exception in handleBankAccountManualVerification:", err);
      toast.error("Verification Error", {
        description: err.message || "Failed to manually verify Bank Statement"
      });
    } finally {
      setIsBankAccountVerifying(false);
    }
  };

  // Separate handler for Bank Account rejection
  const handleBankAccountRejection = async () => {
    setIsBankAccountVerifying(true);
    
    try {
      console.log("Rejecting Bank Statement verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('bank-statement', {
        body: {
          action: 'reject',
          documentId,
          verification_notes: 'Document verification rejected by staff.'
        }
      });
      
      console.log("Bank Statement rejection response:", data, error);
      
      if (error) {
        console.error('Error rejecting Bank Statement:', error);
        toast.error("Rejection Failed", {
          description: error.message || "Failed to reject Bank Statement. Please try again."
        });
        return;
      }
      
      onReject();
    } catch (err: any) {
      console.error("Exception in handleBankAccountRejection:", err);
      toast.error("Rejection Error", {
        description: err.message || "Failed to reject Bank Statement"
      });
    } finally {
      setIsBankAccountVerifying(false);
    }
  };

  // Separate handler for PAN API verification
  const handlePanApiVerification = async () => {
    setIsPanVerifying(true);
    
    try {
      console.log("Initiating PAN verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('pan-verification', {
        body: {
          action: 'apiVerify',
          documentId,
          documentNumber
        }
      });
      
      console.log("PAN verification response:", data, error);
      
      if (error) {
        console.error('Error verifying PAN:', error);
        toast.error("PAN Verification Failed", {
          description: error.message || "Something went wrong during PAN verification. Please try again."
        });
        return;
      }
      
      if (data.success) {
        onVerify('api');
      } else {
        // Use the user-friendly error message from the API
        const errorMessage = data.error || "PAN verification failed. Please try manual verification.";
        toast.error("PAN Verification Failed", {
          description: errorMessage
        });
      }
    } catch (err: any) {
      console.error("Exception in handlePanApiVerification:", err);
      toast.error("PAN Verification Error", {
        description: "Something went wrong during PAN verification. Please try again."
      });
    } finally {
      setIsPanVerifying(false);
    }
  };

  // Separate handler for Driving License API verification
  const handleDrivingLicenseApiVerification = async () => {
    setIsDrivingLicenseVerifying(true);
    
    try {
      console.log("Initiating Driving License verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('driving-license', {
        body: {
          action: 'apiVerify',
          documentId
        }
      });
      
      console.log("Driving License verification response:", data, error);
      
      if (error) {
        console.error('Error verifying Driving License:', error);
        return;
      }
      
      if (data?.success) {
        onVerify('api');
      }
    } catch (err: any) {
      console.error("Exception in handleDrivingLicenseApiVerification:", err);
    } finally {
      setIsDrivingLicenseVerifying(false);
    }
  };

  // Separate handler for Driving License manual verification
  const handleDrivingLicenseManualVerification = async () => {
    setIsDrivingLicenseVerifying(true);
    
    try {
      console.log("Initiating manual Driving License verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('driving-license', {
        body: {
          action: 'manualVerify',
          documentId,
          verification_notes: 'Document manually verified by staff.'
        }
      });
      
      console.log("Driving License manual verification response:", data, error);
      
      if (error) {
        console.error('Error manually verifying Driving License:', error);
        toast.error("Verification Failed", {
          description: error.message || "Failed to manually verify Driving License. Please try again."
        });
        return;
      }
      
      onVerify('manual');
    } catch (err: any) {
      console.error("Exception in handleDrivingLicenseManualVerification:", err);
      toast.error("Verification Error", {
        description: err.message || "Failed to manually verify Driving License"
      });
    } finally {
      setIsDrivingLicenseVerifying(false);
    }
  };

  // Separate handler for Driving License rejection
  const handleDrivingLicenseRejection = async () => {
    setIsDrivingLicenseVerifying(true);
    
    try {
      console.log("Rejecting Driving License verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('driving-license', {
        body: {
          action: 'reject',
          documentId,
          verification_notes: 'Document verification rejected by staff.'
        }
      });
      
      console.log("Driving License rejection response:", data, error);
      
      if (error) {
        console.error('Error rejecting Driving License:', error);
        toast.error("Rejection Failed", {
          description: error.message || "Failed to reject Driving License. Please try again."
        });
        return;
      }
      
      onReject();
    } catch (err: any) {
      console.error("Exception in handleDrivingLicenseRejection:", err);
      toast.error("Rejection Error", {
        description: err.message || "Failed to reject Driving License"
      });
    } finally {
      setIsDrivingLicenseVerifying(false);
    }
  };

  // Separate handler for PAN manual verification
  const handlePanManualVerification = async () => {
    setIsPanVerifying(true);
    
    try {
      console.log("Initiating manual PAN verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('pan-verification', {
        body: {
          action: 'manualVerify',
          documentId,
          verification_notes: 'Document manually verified by staff.'
        }
      });
      
      console.log("PAN manual verification response:", data, error);
      
      if (error) {
        console.error('Error manually verifying PAN:', error);
        toast.error("Verification Failed", {
          description: error.message || "Failed to manually verify PAN. Please try again."
        });
        return;
      }
      
      onVerify('manual');
    } catch (err: any) {
      console.error("Exception in handlePanManualVerification:", err);
      toast.error("Verification Error", {
        description: err.message || "Failed to manually verify PAN"
      });
    } finally {
      setIsPanVerifying(false);
    }
  };

  // Separate handler for PAN rejection
  const handlePanRejection = async () => {
    setIsPanVerifying(true);
    
    try {
      console.log("Rejecting PAN verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('pan-verification', {
        body: {
          action: 'reject',
          documentId,
          verification_notes: 'Document verification rejected by staff.'
        }
      });
      
      console.log("PAN rejection response:", data, error);
      
      if (error) {
        console.error('Error rejecting PAN:', error);
        toast.error("Rejection Failed", {
          description: error.message || "Failed to reject PAN. Please try again."
        });
        return;
      }
      
      onReject();
    } catch (err: any) {
      console.error("Exception in handlePanRejection:", err);
      toast.error("Rejection Error", {
        description: err.message || "Failed to reject PAN"
      });
    } finally {
      setIsPanVerifying(false);
    }
  };

  // Separate handler for Voter ID API verification
  const handleVoterIdApiVerification = async () => {
    setIsVoterIdVerifying(true);
    
    try {
      console.log("Initiating Voter ID verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('voter-verification', {
        body: {
          action: 'apiVerify',
          documentId,
          documentNumber
        }
      });
      
      console.log("Voter ID verification response:", data, error);
      
      if (error) {
        console.error('Error verifying Voter ID:', error);
        toast.error("Voter ID Verification Failed", {
          description: error.message || "Something went wrong during Voter ID verification. Please try again."
        });
        return;
      }
      
      if (data.success) {
        onVerify('api');
      } else {
        // Use the user-friendly error message from the API
        const errorMessage = data.error || "Voter ID verification failed. Please try manual verification.";
        toast.error("Voter ID Verification Failed", {
          description: errorMessage
        });
      }
    } catch (err: any) {
      console.error("Exception in handleVoterIdApiVerification:", err);
      toast.error("Voter ID Verification Error", {
        description: "Something went wrong during Voter ID verification. Please try again."
      });
    } finally {
      setIsVoterIdVerifying(false);
    }
  };

  // Separate handler for Voter ID manual verification
  const handleVoterIdManualVerification = async () => {
    setIsVoterIdVerifying(true);
    
    try {
      console.log("Initiating manual Voter ID verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('voter-verification', {
        body: {
          action: 'manualVerify',
          documentId,
          verification_notes: 'Document manually verified by staff.'
        }
      });
      
      console.log("Voter ID manual verification response:", data, error);
      
      if (error) {
        console.error('Error manually verifying Voter ID:', error);
        toast.error("Verification Failed", {
          description: error.message || "Failed to manually verify Voter ID. Please try again."
        });
        return;
      }
      
      onVerify('manual');
    } catch (err: any) {
      console.error("Exception in handleVoterIdManualVerification:", err);
      toast.error("Verification Error", {
        description: err.message || "Failed to manually verify Voter ID"
      });
    } finally {
      setIsVoterIdVerifying(false);
    }
  };

  // Separate handler for Voter ID rejection
  const handleVoterIdRejection = async () => {
    setIsVoterIdVerifying(true);
    
    try {
      console.log("Rejecting Voter ID verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('voter-verification', {
        body: {
          action: 'reject',
          documentId,
          verification_notes: 'Document verification rejected by staff.'
        }
      });
      
      console.log("Voter ID rejection response:", data, error);
      
      if (error) {
        console.error('Error rejecting Voter ID:', error);
        toast.error("Rejection Failed", {
          description: error.message || "Failed to reject Voter ID. Please try again."
        });
        return;
      }
      
      onReject();
    } catch (err: any) {
      console.error("Exception in handleVoterIdRejection:", err);
      toast.error("Rejection Error", {
        description: err.message || "Failed to reject Voter ID"
      });
    } finally {
      setIsVoterIdVerifying(false);
    }
  };

  // Handle Other document type manual verification
  const handleOtherManualVerification = async () => {
    setIsOtherVerifying(true);
    
    try {
      console.log("Initiating manual verification for Other document type, ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('other-document-verification', {
        body: {
          action: 'manualVerify',
          documentId,
          verification_notes: 'Document manually verified by staff.'
        }
      });
      
      console.log("Other document manual verification response:", data, error);
      
      if (error) {
        console.error('Error manually verifying Other document:', error);
        toast.error("Verification Failed", {
          description: error.message || "Failed to manually verify document. Please try again."
        });
        return;
      }
      
      onVerify('manual');
    } catch (err: any) {
      console.error("Exception in handleOtherManualVerification:", err);
      toast.error("Verification Error", {
        description: err.message || "Failed to manually verify document"
      });
    } finally {
      setIsOtherVerifying(false);
    }
  };
  
  // Handle Other document type rejection
  const handleOtherRejection = async () => {
    setIsOtherRejecting(true);
    
    try {
      console.log("Rejecting verification for Other document type, ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('other-document-verification', {
        body: {
          action: 'reject',
          documentId,
          verification_notes: 'Document verification rejected by staff.'
        }
      });
      
      console.log("Other document rejection response:", data, error);
      
      if (error) {
        console.error('Error rejecting Other document:', error);
        toast.error("Rejection Failed", {
          description: error.message || "Failed to reject document. Please try again."
        });
        return;
      }
      
      onReject();
    } catch (err: any) {
      console.error("Exception in handleOtherRejection:", err);
      toast.error("Rejection Error", {
        description: err.message || "Failed to reject document"
      });
    } finally {
      setIsOtherRejecting(false);
    }
  };

  const handleApiClick = async () => {
    if (isAadhar) {
      if (!documentNumber) {
        toast.error("Verification Failed", {
          description: "Aadhar number is required for verification"
        });
        return;
      }
      
      // Set loading state
      setIsRequestingOtp(true);
      
      // Call the edge function to request OTP
      try {
        console.log("Sending OTP request for document ID:", documentId);
        
        const { data, error } = await supabase.functions.invoke('employee-verification', {
          method: 'POST',
          body: { 
            action: 'requestAadharOtp',
            documentId, 
            documentNumber // Send the plain document number
          }
        });
        
        console.log("OTP request response:", data, error);
        
        if (error) {
          console.error('Error requesting OTP:', error);
          toast.error("OTP Request Failed", {
            description: error.message || "Failed to request OTP. Please try again."
          });
          return;
        }
        
        if (data?.error) {
          if (data.cooldownRemaining) {
            // Handle cooldown period
            startCooldownTimer(data.cooldownRemaining);
          }
          
          toast.error("OTP Request Failed", {
            description: data.error
          });
          return;
        }
        
        // Store transaction ID and client_id for OTP verification
        if (data?.txnId) {
          setTxnId(data.txnId);
          console.log("Transaction ID stored:", data.txnId);
        }
        
        if (data?.client_id) {
          setClientId(data.client_id);
          console.log("Client ID stored:", data.client_id);
        }
        
        setShowOtpInput(true);
        // Start a 3-minute countdown for OTP validity
        startCooldownTimer(3 * 60);
        toast.success("OTP Sent", {
          description: "A verification code has been sent to your registered mobile number"
        });
      } catch (err: any) {
        console.error("Exception in handleApiClick:", err);
        toast.error("OTP Request Error", {
          description: err.message || "Failed to send OTP"
        });
      } finally {
        setIsRequestingOtp(false);
      }
    } else if (isPan) {
      // Use dedicated PAN verification handler
      await handlePanApiVerification();
    } else if (isVoterId) {
      // Use dedicated Voter ID verification handler
      await handleVoterIdApiVerification();
    } else if (isDrivingLicense) {
      // Use dedicated Driving License verification handler
      await handleDrivingLicenseApiVerification();
    } else if (isBankAccount) {
      // Use dedicated Bank Account verification handler
      await handleBankAccountApiVerification();
    } else if (isOther) {
      // Handle Other document type manual verification
      await handleOtherManualVerification();
    } else {
      // For other document types use the generic handler
      onVerify('api');
    }
  };

  const handleManualClick = async () => {
    if (isOther) {
      await handleOtherManualVerification();
    } else if (isPan) {
      await handlePanManualVerification();
    } else if (isVoterId) {
      await handleVoterIdManualVerification();
    } else if (isDrivingLicense) {
      await handleDrivingLicenseManualVerification();
    } else if (isBankAccount) {
      await handleBankAccountManualVerification();
    } else {
      // For Aadhar or other document types
      setIsAadharManualVerifying(true);
      try {
        console.log("Initiating manual verification for document ID:", documentId);
        
        const { data, error } = await supabase.functions.invoke('employee-verification', {
          method: 'POST',
          body: { 
            action: 'manualVerify',
            documentId,
            verification_notes: 'Document manually verified by staff.'
          }
        });
        
        console.log("Manual verification response:", data, error);
        
        if (error) {
          console.error('Error manually verifying document:', error);
          toast.error("Verification Failed", {
            description: error.message || "Failed to manually verify document. Please try again."
          });
          return;
        }
        
        onVerify('manual');
      } catch (err: any) {
        console.error("Exception in manual verification:", err);
        toast.error("Verification Error", {
          description: err.message || "Failed to manually verify document"
        });
      } finally {
        setIsAadharManualVerifying(false);
      }
    }
  };

  const handleRejectClick = async () => {
    if (isOther) {
      await handleOtherRejection();
    } else if (isPan) {
      await handlePanRejection();
    } else if (isVoterId) {
      await handleVoterIdRejection();
    } else if (isDrivingLicense) {
      await handleDrivingLicenseRejection();
    } else if (isBankAccount) {
      await handleBankAccountRejection();
    } else {
      // For other document types including Aadhar
      onReject();
    }
  };

  const handleOtpSubmit = async () => {
    console.log("handleOtpSubmit called - starting OTP verification process");
    
    if (otp.length !== 6) {
      toast.error("Verification Error", {
        description: "Please enter a valid 6-digit OTP"
      });
      return;
    }
    
    // Start with setting the verifying state to true
    setIsVerifyingOtp(true);
    
    try {
      console.log("Submitting OTP verification with:", {
        otp,
        txnId,
        clientId,
        documentId
      });
      
      const requestBody: any = {
        action: 'verifyAadharOtp',
        documentId,
        otp
      };
      
      // Add client_id if available
      if (clientId) {
        requestBody.client_id = clientId;
      }
      
      // Add txnId if available, but don't require it
      if (txnId) {
        requestBody.txnId = txnId;
      }
      
      // Make the API call to verify OTP
      console.log("Invoking employee-verification edge function with requestBody:", requestBody);
      const { data, error } = await supabase.functions.invoke('employee-verification', {
        method: 'POST',
        body: requestBody
      });
      
      console.log("OTP verification response:", data, error);
      
      if (error) {
        console.error('Error verifying OTP:', error);
        toast.error("Verification Failed", {
          description: error.message || "Failed to verify OTP. Please try again."
        });
        setIsVerifyingOtp(false);
        return;
      }
      
      if (data?.error) {
        toast.error("Verification Failed", {
          description: data.error
        });
        setIsVerifyingOtp(false);
        return;
      }
      
      onVerify('api');
      setShowOtpInput(false);
      setOtp("");
      setTxnId(null);
      setClientId(null);
      if (cooldownTimerId !== null) {
        clearInterval(cooldownTimerId);
        setCooldownTimerId(null);
      }
    } catch (err: any) {
      console.error("Exception in handleOtpSubmit:", err);
      toast.error("Verification Failed", {
        description: err.message || "Failed to verify OTP"
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCancel = () => {
    setShowOtpInput(false);
    setOtp("");
    setTxnId(null);
    setClientId(null);
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
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">Verify Document</DialogTitle>
          <DialogDescription className="text-center text-sm">
            Choose a verification method for this {documentType || 'document'}.
          </DialogDescription>
        </DialogHeader>
        {!showOtpInput ? (
          <div className="flex flex-col gap-4 py-4">
            {/* API Verification Button - Hide for "other" document type */}
            {!isOther && (
              <Button 
                variant="outline" 
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 justify-start"
                onClick={handleApiClick}
                disabled={
                  (isAadhar && (isRequestingOtp || cooldownSeconds !== null)) ||
                  (isPan && isPanVerifying) ||
                  (isVoterId && isVoterIdVerifying) ||
                  (isDrivingLicense && isDrivingLicenseVerifying) ||
                  (isBankAccount && isBankAccountVerifying)
                }
              >
                {isRequestingOtp || (isPan && isPanVerifying) || (isVoterId && isVoterIdVerifying) || 
                 (isDrivingLicense && isDrivingLicenseVerifying) || (isBankAccount && isBankAccountVerifying) ? (
                  <Loader2 className="h-4 w-4 mr-3 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-3" />
                )}
                {isAadhar 
                  ? cooldownSeconds !== null 
                    ? `Retry in ${formatTime(cooldownSeconds)}` 
                    : isRequestingOtp 
                      ? 'Requesting OTP...' 
                      : 'Verify via Aadhar API (Requires OTP)' 
                  : isPan
                    ? isPanVerifying ? 'Verifying PAN...' : 'Verify via PAN API'
                    : isVoterId
                      ? isVoterIdVerifying ? 'Verifying Voter ID...' : 'Verify via Voter ID API'
                      : isDrivingLicense
                        ? isDrivingLicenseVerifying ? 'Verifying Driving License...' : 'Verify via Driving License API'
                        : isBankAccount
                          ? isBankAccountVerifying ? 'Verifying Bank Statement...' : 'Verify Bank Statement'
                          : 'Verify via API'
                }
                {cooldownSeconds === null && !isRequestingOtp && !isPanVerifying && !isVoterIdVerifying && 
                 !isDrivingLicenseVerifying && !isBankAccountVerifying && (
                  <span className="ml-auto text-xs text-blue-500 font-normal">
                    {isAadhar ? 'OTP verification' : 
                     isPan ? 'Surepass verification' : 
                     isVoterId ? 'Voter ID verification' : 
                     isDrivingLicense ? 'Driving License verification' :
                     isBankAccount ? 'Bank Statement verification' :
                     'Automated check'}
                  </span>
                )}
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 justify-start"
              onClick={handleManualClick}
              disabled={
                (isAadhar && isAadharManualVerifying) ||
                (isPan && isPanVerifying) ||
                (isVoterId && isVoterIdVerifying) ||
                (isDrivingLicense && isDrivingLicenseVerifying) ||
                (isBankAccount && isBankAccountVerifying) ||
                (isOther && isOtherVerifying)
              }
            >
              {isAadharManualVerifying || isOtherVerifying ? (
                <Loader2 className="h-4 w-4 mr-3 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-3" />
              )}
              {isAadharManualVerifying || isOtherVerifying
                ? 'Processing...' : 'Verify Manually'}
              <span className="ml-auto text-xs text-purple-500 font-normal">Manual review completed</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-200 justify-start"
              onClick={handleRejectClick}
              disabled={
                (isPan && isPanVerifying) ||
                (isVoterId && isVoterIdVerifying) ||
                (isDrivingLicense && isDrivingLicenseVerifying) ||
                (isBankAccount && isBankAccountVerifying) ||
                (isOther && isOtherRejecting)
              }
            >
              {isOtherRejecting ? (
                <Loader2 className="h-4 w-4 mr-3 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-3" />
              )}
              {isOtherRejecting
                ? 'Processing...' : 'Reject Document'}
              <span className="ml-auto text-xs text-red-500 font-normal">Document verification failed</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-4">
              <Label htmlFor="otp" className="text-center block">Enter 6-digit OTP received</Label>
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
        <DialogFooter className="flex justify-center sm:justify-end mt-4">
          {showOtpInput ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isVerifyingOtp}>
                Cancel
              </Button>
              <Button 
                onClick={handleOtpSubmit}
                disabled={isVerifyingOtp || otp.length !== 6}
                className="ml-2"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </>
          ) : (
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={
                isRequestingOtp || isPanVerifying || isVoterIdVerifying || 
                isDrivingLicenseVerifying || isBankAccountVerifying || isAadharManualVerifying ||
                isOtherVerifying || isOtherRejecting
              }
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
