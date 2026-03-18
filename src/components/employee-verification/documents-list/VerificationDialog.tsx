import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDocumentTypeName } from '../utils/documentUtils';
import AadharDetailsDialog from '../documents-list/AadharDetailsDialog';
import PanDetailsDialog from '../document-card/PanDetailsDialog';
import VoterIdDetailsDialog from '../document-card/VoterIdDetailsDialog';
import DrivingLicenseDetailsDialog from '../document-card/DrivingLicenseDetailsDialog';
import PassportDetailsDialog from '../document-card/PassportDetailsDialog';
import BankStatementDetailsDialog from '../document-card/BankStatementDetailsDialog';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (method: 'api' | 'manual') => void;
  onReject: () => void;
  isVerifying: boolean;
  documentType?: string;
  documentId?: string;
  documentNumber?: string;
  quickStartMethod?: 'api' | 'manual' | null;
  documents?: any[]; // Add documents prop to find the updated document
  onDocumentAction?: () => void; // Add callback for document updates
  setIsVerificationLoading?: (loading: boolean) => void; // Add loading state setter
  employeeName?: string; // Add employee name prop
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({
  open,
  onOpenChange,
  onVerify,
  onReject,
  isVerifying,
  documentType = '',
  employeeName,
  documentId = '',
  documentNumber = '',
  quickStartMethod = null,
  documents = [],
  onDocumentAction,
  setIsVerificationLoading,
}) => {
  const { toast: shadcnToast } = useToast();
  
  // Debug logging for props
  console.log('VerificationDialog - Received props:', { documentId, documentType, quickStartMethod });
  
  // Wrapper for onDocumentAction that includes loading state
  const handleDocumentActionWithLoading = async () => {
    if (onDocumentAction) {
      setIsVerificationLoading?.(true);
      await onDocumentAction();
      setIsVerificationLoading?.(false);
    }
  };
  
  const isAadhar = documentType?.toLowerCase().includes('aadhar') || 
                   documentType?.toLowerCase().includes('aadhaar');
  const isPan = documentType === 'pan';
  const isVoterId = documentType === 'voter_id';
  const isDrivingLicense = documentType === 'driving_license';
  const isPassport = documentType === 'passport';
  const isBankAccount = documentType === 'bank_account';
  const isOther = documentType === 'other';
  const isOtherDocuments = documentType === 'other_documents';
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
  const [isPassportVerifying, setIsPassportVerifying] = useState(false);
  const [isBankAccountVerifying, setIsBankAccountVerifying] = useState(false);
  const [isAadharManualVerifying, setIsAadharManualVerifying] = useState(false);
  const [isOtherVerifying, setIsOtherVerifying] = useState(false);
  const [isOtherRejecting, setIsOtherRejecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [otpExpired, setOtpExpired] = useState(false);

  const autoStartedRef = useRef(false);

  // Get OTP validity from environment variable (in minutes), default to 10 minutes
  const OTP_VALIDITY_MINUTES = (() => {
    const envValue = import.meta.env.VITE_AADHAR_OTP_VALIDITY;
    const parsed = parseInt(envValue as string || '10', 10);
    console.log('OTP Validity from env:', { envValue, parsed, finalMinutes: parsed });
    return parsed;
  })();
  const OTP_VALIDITY_SECONDS = OTP_VALIDITY_MINUTES * 60;
  console.log('OTP Validity in seconds:', OTP_VALIDITY_SECONDS);

  // Detail dialog states
  const [aadharDialogOpen, setAadharDialogOpen] = useState(false);
  const [panDialogOpen, setPanDialogOpen] = useState(false);
  const [voterIdDialogOpen, setVoterIdDialogOpen] = useState(false);
  const [drivingLicenseDialogOpen, setDrivingLicenseDialogOpen] = useState(false);
  const [passportDialogOpen, setPassportDialogOpen] = useState(false);
  const [bankStatementDialogOpen, setBankStatementDialogOpen] = useState(false);
  
  // Cleanup effect to reset loading state when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset loading state when dialog closes
      setIsVerificationLoading?.(false);
    }
  }, [open, setIsVerificationLoading]);

  // Detail data states
  const [selectedAadharDetails, setSelectedAadharDetails] = useState<any>(null);
  const [selectedPanDetails, setSelectedPanDetails] = useState<any>(null);
  const [selectedVoterIdDetails, setSelectedVoterIdDetails] = useState<any>(null);
  const [selectedDrivingLicenseDetails, setSelectedDrivingLicenseDetails] = useState<any>(null);
  const [selectedPassportDetails, setSelectedPassportDetails] = useState<any>(null);
  const [selectedBankStatementDetails, setSelectedBankStatementDetails] = useState<any>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string>('');

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
      setIsAadharManualVerifying(false);
      setIsOtherVerifying(false);
      setIsOtherRejecting(false);

      // Note: Do NOT reset detail dialog states here.
      // We may need to immediately open a details dialog (e.g., Aadhaar) after
      // closing the OTP popup. Resetting would create a race condition that
      // prevents the details dialog from opening with the fetched data.
      if (cooldownTimerId !== null) {
        clearInterval(cooldownTimerId);
        setCooldownTimerId(null);
      }
      setCooldownSeconds(null);
      setOtpExpired(false); // Reset expired state when dialog closes
    }
    autoStartedRef.current = false;
  }, [open]);

  // Note: openDetailDialogAfterSuccess function removed - we now open dialogs directly with API response data

  // Auto-start when quickStartMethod is provided
  useEffect(() => {
    if (open && quickStartMethod && !autoStartedRef.current) {
      autoStartedRef.current = true;
      if (quickStartMethod === 'manual') {
          handleManualClick();
        }
      // For API quickStart, just show the dialog - don't auto-click the API button
    }
  }, [open, quickStartMethod, isOther, isOtherDocuments]);

  // Check if OTP was already generated and is still valid when dialog opens
  useEffect(() => {
    if (open && isAadhar && documentId && documents.length > 0) {
      const currentDocument = documents.find(doc => doc.id === documentId);
      if (currentDocument?.lastOtpGenerated) {
        const lastOtpTime = new Date(currentDocument.lastOtpGenerated);
        const currentTime = new Date();
        const timeDiffMinutes = (currentTime.getTime() - lastOtpTime.getTime()) / (1000 * 60);
        
        // If OTP is still valid (less than validity period old), show OTP input
        if (timeDiffMinutes < OTP_VALIDITY_MINUTES) {
          const remainingSeconds = Math.ceil((OTP_VALIDITY_MINUTES - timeDiffMinutes) * 60);
          setShowOtpInput(true);
          startCooldownTimer(remainingSeconds);
          console.log('OTP already generated and still valid, showing OTP input');
        }
      }
    }
  }, [open, isAadhar, documentId, documents]);

  const startCooldownTimer = (seconds: number) => {
    console.info("Starting cooldown timer with seconds:", seconds, "current time:", new Date().toISOString());
    console.info("OTP_VALIDITY_SECONDS constant:", OTP_VALIDITY_SECONDS, "OTP_VALIDITY_MINUTES:", OTP_VALIDITY_MINUTES);
    setCooldownSeconds(seconds);
    setOtpExpired(false); // Reset expired state when starting new timer
    
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
          // When timer reaches 0, hide OTP input and show expired warning
          if (showOtpInput) {
            setShowOtpInput(false);
            setOtpExpired(true);
            setOtp(""); // Clear OTP input
          }
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
        setErrorMessage(error.message || "Something went wrong during Bank Statement verification. Please try again.");
        return;
      }
      
      // Check if API response indicates success and has actual data
      const apiResponse = data?.data;
      const isApiSuccess = apiResponse?.success === true && apiResponse?.status_code === 200;
      const hasData = apiResponse && Object.keys(apiResponse).length > 0;
      
      if (data?.success && isApiSuccess && hasData) {
        console.log('VerificationDialog - Bank Statement verification successful, response data:', data);
        // No toaster for API verification completion
        
        // Close verification popup FIRST
        onOpenChange(false);
        
        // Refresh document data
        if (onDocumentAction) {
          await onDocumentAction();
        }
        
        // Use setTimeout to ensure verification dialog is fully closed before opening detail dialog
        setTimeout(() => {
          // Open Bank Statement detail dialog directly with response data
          setCurrentDocumentId(documentId);
          
          // The dialog expects data in response.data format, so we structure it correctly
          const formattedBankStatementDetails = {
            data: apiResponse, // The actual Bank Statement details from the API response
            success: true,
            status_code: apiResponse.status_code,
            message: apiResponse.message
          };
          setSelectedBankStatementDetails(formattedBankStatementDetails);
          setBankStatementDialogOpen(true);
        }, 100);
      } else {
        // Show meaningful error message in the current popup
        const errorMessage = apiResponse?.message || data?.message || data?.error || "Bank Statement verification failed. Please check your details and try again.";
        setErrorMessage(errorMessage);
      }
    } catch (err: any) {
      console.error("Exception in handleBankAccountApiVerification:", err);
      setErrorMessage("Something went wrong during Bank Statement verification. Please try again.");
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
      
      toast.success("Bank Statement Manually Verified", {
        description: data?.message || "The Bank Statement has been manually verified successfully."
      });
      onOpenChange(false);
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
      
      toast.success("Bank Statement Rejected", {
        description: data?.message || "The Bank Statement has been rejected successfully."
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Exception in handleBankAccountRejection:", err);
      toast.error("Rejection Error", {
        description: err.message || "Failed to reject Bank Statement"
      });
    } finally {
      setIsBankAccountVerifying(false);
    }
  };

  // Passport handlers
  const handlePassportApiVerification = async () => {
    setIsPassportVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('passport-verification', {
        body: { action: 'apiVerify', documentId }
      });
      if (error) {
        setErrorKey(null);
        setErrorMessage(error.message || 'Something went wrong during Passport verification.');
        return;
      }
      // Check if API response indicates success (status_code 200) and has actual data
      // Passport edge function returns { success: true, data: apiResponse }
      // where apiResponse has { success, status_code, data: {...} }
      const apiResponse = data?.data;
      const isApiSuccess = apiResponse?.success === true && apiResponse?.status_code === 200;
      const apiData = apiResponse?.data; // The actual passport data object
      const hasData = apiData && Object.keys(apiData).length > 0;
      const isInProgress = data?.error_key === 'in-progress';

      // Only open details dialog if API call was successful and has valid data
      if (data?.success && isApiSuccess && hasData) {
        setErrorKey(null);
        setErrorMessage(null);
        onOpenChange(false);
        if (onDocumentAction) await onDocumentAction();
        setTimeout(() => {
          setCurrentDocumentId(documentId);
          const formatted = { 
            data: apiData, // The actual passport data
            success: true, 
            status_code: apiResponse.status_code, 
            message: apiResponse.message 
          };
          setSelectedPassportDetails(formatted);
          setPassportDialogOpen(true);
        }, 100);
      } else {
        if (isInProgress) {
          setErrorKey('in-progress');
          setErrorMessage(data?.error ?? 'Your verification request is being processed.');
        } else {
          setErrorKey(null);
          const errorMsg = apiResponse?.message || data?.message || data?.error || 'Passport verification failed. Please check your details and try again.';
          setErrorMessage(errorMsg);
        }
      }
    } catch (err: any) {
      setErrorKey(null);
      setErrorMessage(err.message || 'Passport verification error.');
    } finally {
      setIsPassportVerifying(false);
    }
  };

  const handlePassportManualVerification = async () => {
    setIsPassportVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('passport-verification', {
        body: { action: 'manualVerify', documentId }
      });
      if (error) {
        toast.error('Verification Failed', { description: error.message || 'Failed to manually verify Passport.' });
        return;
      }
      toast.success('Passport Manually Verified', { description: data?.message || 'The Passport has been manually verified successfully.' });
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Verification Error', { description: err.message || 'Failed to manually verify Passport' });
    } finally {
      setIsPassportVerifying(false);
    }
  };

  const handlePassportRejection = async () => {
    setIsPassportVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('passport-verification', {
        body: { action: 'reject', documentId, verification_notes: 'Document verification rejected by staff.' }
      });
      if (error) {
        toast.error('Rejection Failed', { description: error.message || 'Failed to reject Passport. Please try again.' });
        return;
      }
      toast.success('Passport Rejected', { description: data?.message || 'The Passport has been rejected successfully.' });
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Rejection Error', { description: err.message || 'Failed to reject Passport' });
    } finally {
      setIsPassportVerifying(false);
    }
  };

  // Separate handler for PAN API verification
  const handlePanApiVerification = async () => {
    setIsPanVerifying(true);
    setIsVerificationLoading?.(true);
    
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
      console.log("PAN verification - data.success:", data?.success);
      console.log("PAN verification - typeof data:", typeof data);
      console.log("PAN verification - data keys:", data ? Object.keys(data) : 'data is null/undefined');
      
      if (error) {
        console.error('Error verifying PAN:', error);
        setErrorKey(null);
        setErrorMessage(error.message || "Something went wrong during PAN verification. Please try again.");
        return;
      }

      // Check if API response indicates success and has actual data
      // The edge function spreads apiResponse into the top level, so status_code is at data.status_code
      const isApiSuccess = data?.success === true && data?.status_code === 200;
      const apiData = data?.data; // The actual PAN data object
      const hasData = apiData && Object.keys(apiData).length > 0;
      const isInProgress = data?.error_key === 'in-progress';

      if (isApiSuccess && hasData) {
        console.log('PAN verification SUCCESS - entering success block');
        setErrorKey(null);
        setErrorMessage(null);
        // No toaster for API verification completion

        // Close verification popup FIRST
        console.log('PAN verification - About to close verification dialog');
        onOpenChange(false);

        // Refresh document data
        console.log('PAN verification - About to refresh document data');
        if (onDocumentAction) {
          await onDocumentAction();
          console.log('PAN verification - Document data refreshed');
        }

        // Use setTimeout to ensure verification dialog is fully closed before opening detail dialog
        setTimeout(() => {
          // Open PAN detail dialog directly with response data
          console.log('VerificationDialog - About to open PAN dialog with data:', data);
          console.log('VerificationDialog - documentId:', documentId);
          setCurrentDocumentId(documentId);

          // The dialog expects data in response.data format, so we structure it correctly
          const formattedPanDetails = {
            data: apiData, // The actual PAN details from the API response
            success: true,
            status_code: data.status_code,
            message: data.message
          };
          console.log('VerificationDialog - Formatted PAN details:', formattedPanDetails);
          setSelectedPanDetails(formattedPanDetails);
          setPanDialogOpen(true);
          console.log('VerificationDialog - PAN dialog state set to open');
        }, 100); // Small delay to ensure verification dialog closes completely
      } else {
        if (isInProgress) {
          setErrorKey('in-progress');
          setErrorMessage(data?.error ?? 'Your verification request is being processed.');
        } else {
          setErrorKey(null);
          const errorMessage = data?.message || data?.error || "PAN verification failed. Please check your details and try again.";
          setErrorMessage(errorMessage);
        }
      }
    } catch (err: any) {
      console.error("Exception in handlePanApiVerification:", err);
      setErrorKey(null);
      setErrorMessage("Something went wrong during PAN verification. Please try again.");
    } finally {
      setIsPanVerifying(false);
      setIsVerificationLoading?.(false);
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
        setErrorKey(null);
        setErrorMessage(error.message || "Something went wrong during Driving License verification. Please try again.");
        return;
      }

      // Check if API response indicates success and has actual data
      // The edge function spreads apiResponse into the top level, so status_code is at data.status_code
      const isApiSuccess = data?.success === true && data?.status_code === 200;
      const apiData = data?.data; // The actual license data object
      const hasData = apiData && Object.keys(apiData).length > 0;
      const isInProgress = data?.error_key === 'in-progress';

      if (isApiSuccess && hasData) {
        console.log('VerificationDialog - Driving License verification successful, response data:', data);
        setErrorKey(null);
        setErrorMessage(null);
        // No toaster for API verification completion

        // Close verification popup FIRST
        onOpenChange(false);

        // Refresh document data
        if (onDocumentAction) {
          await onDocumentAction();
        }

        // Use setTimeout to ensure verification dialog is fully closed before opening detail dialog
        setTimeout(() => {
          // Open Driving License detail dialog directly with response data
          setCurrentDocumentId(documentId);

          // The dialog expects data in response.data format, so we structure it correctly
          const formattedDrivingLicenseDetails = {
            data: apiData, // The actual Driving License details from the API response
            success: true,
            status_code: data.status_code,
            message: data.message
          };
          setSelectedDrivingLicenseDetails(formattedDrivingLicenseDetails);
          setDrivingLicenseDialogOpen(true);
        }, 100);
      } else {
        if (isInProgress) {
          setErrorKey('in-progress');
          setErrorMessage(data?.error ?? 'Your verification request is being processed.');
        } else {
          setErrorKey(null);
          const errorMessage = data?.message || data?.error || "Driving License verification failed. Please check your details and try again.";
          setErrorMessage(errorMessage);
        }
      }
    } catch (err: any) {
      console.error("Exception in handleDrivingLicenseApiVerification:", err);
      setErrorKey(null);
      setErrorMessage("Something went wrong during Driving License verification. Please try again.");
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
      
      toast.success("Driving License Manually Verified", {
        description: data?.message || "The Driving License has been manually verified successfully."
      });
      onOpenChange(false);
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
      
      toast.success("Driving License Rejected", {
        description: data?.message || "The Driving License has been rejected successfully."
      });
      onOpenChange(false);
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
      
      toast.success("PAN Manually Verified", {
        description: data?.message || "The PAN has been manually verified successfully."
      });
      onOpenChange(false);
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
      
      toast.success("PAN Rejected", {
        description: data?.message || "The PAN has been rejected successfully."
      });
      onOpenChange(false);
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
    setIsVerificationLoading?.(true);
    
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
        setErrorKey(null);
        setErrorMessage(error.message || "Something went wrong during Voter ID verification. Please try again.");
        return;
      }

      // Check if API response indicates success and has actual data
      // The edge function spreads apiResponse into the top level, so status_code is at data.status_code
      const isApiSuccess = data?.success === true && data?.status_code === 200;
      const apiData = data?.data; // The actual Voter ID data object
      const hasData = apiData && Object.keys(apiData).length > 0;
      const isInProgress = data?.error_key === 'in-progress';

      if (isApiSuccess && hasData) {
        setErrorKey(null);
        setErrorMessage(null);
        // No toaster for API verification completion

        // Close verification popup FIRST
        onOpenChange(false);

        // Refresh document data
        if (onDocumentAction) {
          await onDocumentAction();
        }

        // Use setTimeout to ensure verification dialog is fully closed before opening detail dialog
        setTimeout(() => {
          // Open Voter ID detail dialog directly with response data
          setCurrentDocumentId(documentId);

          // The dialog expects data in response.data format, so we structure it correctly
          const formattedVoterIdDetails = {
            data: apiData, // The actual Voter ID details from the API response
            success: true,
            status_code: data.status_code,
            message: data.message
          };
          setSelectedVoterIdDetails(formattedVoterIdDetails);
          setVoterIdDialogOpen(true);
        }, 100);
      } else {
        if (isInProgress) {
          setErrorKey('in-progress');
          setErrorMessage(data?.error ?? 'Your verification request is being processed.');
        } else {
          setErrorKey(null);
          const errorMessage = data?.message || data?.error || "Voter ID verification failed. Please check your details and try again.";
          setErrorMessage(errorMessage);
        }
      }
    } catch (err: any) {
      console.error("Exception in handleVoterIdApiVerification:", err);
      setErrorKey(null);
      setErrorMessage("Something went wrong during Voter ID verification. Please try again.");
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
      
      toast.success("Voter ID Manually Verified", {
        description: data?.message || "The Voter ID has been manually verified successfully."
      });
      onOpenChange(false);
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
      
      toast.success("Voter ID Rejected", {
        description: data?.message || "The Voter ID has been rejected successfully."
      });
      onOpenChange(false);
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
      
      toast.success("Document Manually Verified", {
        description: data?.message || "The document has been manually verified successfully."
      });
      onOpenChange(false);
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
      
      toast.success("Document Rejected", {
        description: data?.message || "The document has been rejected successfully."
      });
      onOpenChange(false);
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
      console.log('VerificationDialog - Aadhaar OTP flow');
      if (!documentNumber) {
        toast.error("Verification Failed", {
          description: "Aadhaar number is required for verification"
        });
        return;
      }
      const sanitizedAadhaar = (documentNumber || '').replace(/\D/g, '');
      if (sanitizedAadhaar.length !== 12) {
        setErrorMessage('Please enter a valid 12-digit Aadhaar number');
        return;
      }
      setIsRequestingOtp(true);
      setOtpExpired(false); // Reset expired state when requesting new OTP
      try {
        const { data, error } = await supabase.functions.invoke('employee-verification', {
          body: {
            action: 'requestAadharOtp',
            documentId,
            documentNumber: sanitizedAadhaar
          }
        });
        if (error) throw new Error(error.message || 'Failed to request OTP');

        // In-progress: show info box instead of error
        if (data?.success === false && data?.error_key === 'in-progress') {
          setErrorKey('in-progress');
          setErrorMessage(data?.error ?? 'Your verification request is being processed.');
          return;
        }
        
        // Handle case where OTP is already sent and still valid
        if (data?.otpStatus === 'valid' && data?.showOtpInput) {
          setErrorKey(null);
          setErrorMessage(null);
          setShowOtpInput(true);
          setOtpExpired(false); // Ensure expired state is false
          if (data?.cooldownRemaining) {
            startCooldownTimer(data.cooldownRemaining);
          } else {
            startCooldownTimer(OTP_VALIDITY_SECONDS);
          }
          // Store client_id from response for OTP verification if available
          if (data?.client_id) {
            setClientId(String(data.client_id));
          }
          return; // Don't show error, just show OTP input
        }

        if (data?.error) {
          setErrorKey(null);
          throw new Error(data.error);
        }
        setErrorKey(null);
        setErrorMessage(null);
        // Store client_id from response for OTP verification
        if (data?.client_id) {
          setClientId(String(data.client_id));
        }
        setShowOtpInput(true);
        setOtpExpired(false); // Ensure expired state is false
        if (typeof data?.expires_in === 'number') {
          startCooldownTimer(data.expires_in);
        } else {
          startCooldownTimer(OTP_VALIDITY_SECONDS);
        }
      } catch (err: any) {
        console.error('requestAadharOtp error:', err);
        setErrorKey(null);
        setErrorMessage(err.message || 'Failed to request OTP. Please try again.');
      } finally {
        setIsRequestingOtp(false);
      }
    } else if (isPan) {
      // Use dedicated PAN verification handler directly
      await handlePanApiVerification();
    } else if (isVoterId) {
      // Use dedicated Voter ID verification handler directly
      await handleVoterIdApiVerification();
    } else if (isDrivingLicense) {
      // Use dedicated Driving License verification handler directly
      await handleDrivingLicenseApiVerification();
    } else if (isPassport) {
      await handlePassportApiVerification();
    } else if (isBankAccount) {
      // Use dedicated Bank Account verification handler directly
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
    if (isOther || isOtherDocuments) {
      await handleOtherManualVerification();
    } else if (isPan) {
      await handlePanManualVerification();
    } else if (isVoterId) {
      await handleVoterIdManualVerification();
    } else if (isDrivingLicense) {
      await handleDrivingLicenseManualVerification();
    } else if (isPassport) {
      await handlePassportManualVerification();
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
        
        toast.success("Document Manually Verified", {
          description: data?.message || "The document has been manually verified successfully."
        });
        onOpenChange(false);
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
    if (isOther || isOtherDocuments) {
      await handleOtherRejection();
    } else if (isPan) {
      await handlePanRejection();
    } else if (isVoterId) {
      await handleVoterIdRejection();
    } else if (isDrivingLicense) {
      await handleDrivingLicenseRejection();
    } else if (isPassport) {
      await handlePassportRejection();
    } else if (isBankAccount) {
      await handleBankAccountRejection();
    } else {
      // For other document types including Aadhar
      onReject();
    }
  };

     // COMMENTED OUT: Old OTP-based Aadhaar verification - replaced with secure government integration
  const handleOtpSubmit = async () => {
    console.log('handleOtpSubmit - Aadhaar OTP verification');
    if (otp.length !== 6) {
      toast.error("Verification Error", { description: "Please enter a valid 6-digit OTP" });
      return;
    }
    setIsVerifyingOtp(true);
    try {
      // Build request body with client_id if available
      const requestBody: any = {
        action: 'verifyAadharOtp',
        documentId,
        otp
      };
      
      // Include client_id if available (required for OTP verification)
      if (clientId) {
        requestBody.client_id = clientId;
      }
      
      const { data, error } = await supabase.functions.invoke('employee-verification', {
        body: requestBody
      });
      if (error) throw new Error(error.message || 'Failed to verify OTP');
      if (data?.error || data?.success === false) throw new Error(data?.error || 'OTP verification failed');
      // Close consent dialog, then open Aadhaar details dialog on next tick
      setCurrentDocumentId(documentId);
      setSelectedAadharDetails({ response: data });
      setTimeout(() => {
        onOpenChange(false);
        setAadharDialogOpen(true);
      }, 50);
      if (onDocumentAction) await onDocumentAction();
    } catch (err: any) {
      console.error('verifyAadharOtp error:', err);
      setErrorMessage(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };
   
   // const handleOtpSubmit = async () => {
  //   console.log("handleOtpSubmit called - starting OTP verification process");
  //   
  //   if (otp.length !== 6) {
  //     toast.error("Verification Error", {
  //       description: "Please enter a valid 6-digit OTP"
  //     });
  //     return;
  //   }
  //   
  //   // Start with setting the verifying state to true
  //   setIsVerifyingOtp(true);
  //   
  //   try {
  //     console.log("Submitting OTP verification with:", {
  //       otp,
  //       txnId,
  //       clientId,
  //       documentId
  //     });
  //     
  //     const requestBody: any = {
  //       action: 'verifyAadharOtp',
  //       documentId,
  //       otp
  //     };
  //     
  //     // Add client_id if available
  //     if (clientId) {
  //       requestBody.client_id = clientId;
  //     }
  //     
  //     // Add txnId if available, but don't require it
  //     if (txnId) {
  //       requestBody.txnId = txnId;
  //     }
  //     
  //     // Make the API call to verify OTP
  //     console.log("Invoking employee-verification edge function with requestBody:", requestBody);
  //     const { data, error } = await supabase.functions.invoke('employee-verification', {
  //       method: 'POST',
  //       body: requestBody
  //     });
  //     
  //     console.log("OTP verification response:", data, error);
  //     
  //     if (error) {
  //       console.error('Error verifying OTP:', error);
  //       toast.error("Verification Failed", {
  //         description: error.message || "Failed to verify OTP. Please try again."
  //       });
  //       onOpenChange(false); // Close the dialog
  //       if (onDocumentAction) {
  //         await onDocumentAction(); // Refresh document data
  //       }
  //       setIsVerifyingOtp(false);
  //       return;
  //     }
  //     
  //     // Check for success flag first, then handle errors
  //     if (data?.success === false || data?.error) {
  //       toast.error("Verification Failed", {
  //         description: data.error || "Failed to verify OTP. Please try again."
  //       });
  //       onOpenChange(false); // Close the dialog
  //       if (onDocumentAction) {
  //         await onDocumentAction(); // Refresh document data
  //       }
  //       setIsVerifyingOtp(false);
  //       return;
  //     }
  //     
  //     onVerify('api');
  //     setShowOtpInput(false);
  //     setOtp("");
  //     setTxnId(null);
  //     setClientId(null);
  //     if (cooldownTimerId !== null) {
  //       clearInterval(cooldownTimerId);
  //       setCooldownTimerId(null);
  //     }
  //   } catch (err: any) {
  //     console.error("Exception in handleOtpSubmit:", err);
  //     toast.error("Verification Failed", {
  //       description: err.message || "Failed to verify OTP"
  //     });
  //     onOpenChange(false); // Close the dialog
  //     if (onDocumentAction) {
  //       await onDocumentAction(); // Refresh document data
  //     }
  //   } finally {
  //     setIsVerifyingOtp(false);
  //   }
  // };

  const handleCancel = () => {
    setShowOtpInput(false);
    setOtp("");
    setTxnId(null);
    setClientId(null);
    setErrorMessage(null);
    setErrorKey(null);

    if (cooldownTimerId !== null) {
      clearInterval(cooldownTimerId);
      setCooldownTimerId(null);
    }
    setCooldownSeconds(null);
    
    // Reset all verification states
    setIsRequestingOtp(false);
    setIsVerifyingOtp(false);
    setIsPanVerifying(false);
    setIsVoterIdVerifying(false);
    setIsDrivingLicenseVerifying(false);
    setIsBankAccountVerifying(false);
    setIsAadharManualVerifying(false);
    setIsOtherVerifying(false);
    setIsOtherRejecting(false);
    
    // Reset loading state
    setIsVerificationLoading?.(false);
    
    // Close the dialog
    onOpenChange(false);
  };

  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
            "max-w-lg mx-auto"
          )}
          onInteractOutside={(e) => { if (showOtpInput) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (showOtpInput) e.preventDefault(); }}
        >
        {/* Error / In-Progress Message Display */}
        {errorMessage && (
          errorKey === 'in-progress' ? (
            <div className="mt-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Verification in Progress</h3>
                    <div className="mt-1 text-sm text-amber-700 whitespace-pre-line">
                      Your verification request is being processed. In some cases, additional checks are required to ensure accuracy and compliance.
                      {'\n'}Our team will review and update the status within 24 hours.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setErrorMessage(null); setErrorKey(null); }}
                  className="flex-shrink-0 ml-3 text-amber-500 hover:text-amber-700 transition-colors"
                  title="Close message"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ShieldCheck className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
                    <div className="mt-1 text-sm text-red-700">
                      {errorMessage}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setErrorMessage(null); setErrorKey(null); }}
                  className="flex-shrink-0 ml-3 text-red-400 hover:text-red-600 transition-colors"
                  title="Close error message"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )
        )}
        
        <DialogHeader className="text-center">
          <div className="flex justify-center py-1">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold text-center">
            {isAadhar ? 'Aadhaar Verification' : 'API Document Verification'}
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {isAadhar 
              ? 'Verify Aadhaar data through secure government integration'
              : 'Verify employee data through automated API validation'
            }
          </DialogDescription>
        </DialogHeader>
        {otpExpired ? (
          // OTP Expired Warning
          <div className="flex flex-col gap-4 py-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-amber-800">OTP Expired</h3>
                  <div className="mt-1 text-sm text-amber-700">
                    The OTP has expired. Please click the "Request New OTP" button below to request a new OTP.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !showOtpInput ? (
          // Consent checkbox content
          <div className="flex flex-col gap-4 py-4">

            <div className="text-sm text-muted-foreground text-center">
              {isAadhar 
                ? 'Click the verify button to open secure government portal for Aadhaar verification.'
                : 'Click the verify button to fetch and validate employee data through our secure API.'
              }
            </div>
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
          {otpExpired ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleApiClick}
                disabled={isRequestingOtp}
                className="ml-2"
              >
                {isRequestingOtp ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Request New OTP
              </Button>
            </>
          ) : showOtpInput ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isVerifyingOtp}>
                Cancel
              </Button>
              <Button 
                onClick={handleOtpSubmit}
                disabled={isVerifyingOtp || otp.length !== 6}
                className="ml-2"
              >
                {isVerifyingOtp ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                OK
              </Button>
            </>
          ) : (
            <>
              {errorKey === 'in-progress' ? (
                <Button onClick={handleCancel}>OK</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleApiClick}
                    disabled={
                      isRequestingOtp ||
                      isPanVerifying ||
                      isVoterIdVerifying ||
                      isDrivingLicenseVerifying ||
                      isPassportVerifying ||
                      isBankAccountVerifying ||
                      isAadharManualVerifying ||
                      isOtherVerifying ||
                      isOtherRejecting
                    }
                  >
                    {isRequestingOtp ||
                    isPanVerifying ||
                    isVoterIdVerifying ||
                    isDrivingLicenseVerifying ||
                    isPassportVerifying ||
                    isBankAccountVerifying ||
                    isAadharManualVerifying ||
                    isOtherVerifying ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Verify
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
      
      {/* Detail Dialogs */}
            <AadharDetailsDialog
        open={aadharDialogOpen}
        onOpenChange={setAadharDialogOpen}
        aadharDetails={selectedAadharDetails}
        documentId={currentDocumentId || documentId}
        onVerificationUpdate={handleDocumentActionWithLoading}
      />
      
      <PanDetailsDialog 
        open={panDialogOpen}
        onOpenChange={setPanDialogOpen}
        panDetails={selectedPanDetails}
        documentId={currentDocumentId || documentId}
        onVerificationUpdate={handleDocumentActionWithLoading}
      />
      
      <VoterIdDetailsDialog
        open={voterIdDialogOpen}
        onOpenChange={setVoterIdDialogOpen}
        voterIdDetails={selectedVoterIdDetails}
        documentId={currentDocumentId || documentId}
        onVerificationUpdate={handleDocumentActionWithLoading}
      />
      
      <DrivingLicenseDetailsDialog
        open={drivingLicenseDialogOpen}
        onOpenChange={setDrivingLicenseDialogOpen}
        licenseDetails={selectedDrivingLicenseDetails}
        documentId={currentDocumentId || documentId}
        onVerificationUpdate={handleDocumentActionWithLoading}
      />
      
      <PassportDetailsDialog
        open={passportDialogOpen}
        onOpenChange={setPassportDialogOpen}
        passportDetails={selectedPassportDetails}
        documentId={currentDocumentId || documentId}
        onVerificationUpdate={handleDocumentActionWithLoading}
      />
      
      <BankStatementDetailsDialog
        open={bankStatementDialogOpen}
        onOpenChange={setBankStatementDialogOpen}
        statementDetails={selectedBankStatementDetails}
        documentId={currentDocumentId || documentId}
        onVerificationUpdate={handleDocumentActionWithLoading}
      />
      
      {/* Removed separate ApiConsentDialog */}
    </Dialog>
  );
};

export default VerificationDialog;
