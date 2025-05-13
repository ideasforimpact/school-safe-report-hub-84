
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from "lucide-react";
import OtpVerificationDialog from './OtpVerificationDialog';

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
  const { toast } = useToast();
  const isAadhar = documentType === 'aadhar';
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [cooldownTimerId, setCooldownTimerId] = useState<number | null>(null);
  const [txnId, setTxnId] = useState<string | undefined>(undefined);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerId) {
        clearInterval(cooldownTimerId);
      }
    };
  }, [cooldownTimerId]);

  // Log document information when dialog opens
  useEffect(() => {
    if (open) {
      console.log('Verification Dialog opened with:', {
        documentType,
        documentId,
        documentNumber,
        isAadhar
      });
    }
  }, [open, documentType, documentId, documentNumber, isAadhar]);

  const handleDialogClose = () => {
    if (cooldownTimerId) {
      clearInterval(cooldownTimerId);
      setCooldownTimerId(null);
    }
    setCooldownSeconds(null);
    setShowOtpInput(false);
    onOpenChange(false);
  };

  const handleAadharApiClick = async () => {
    if (isAadhar) {
      if (!documentNumber) {
        toast({
          title: "Error",
          description: "Aadhar number is required for verification",
          variant: "destructive"
        });
        return;
      }
      
      try {
        console.log('Requesting OTP with:', {
          documentId,
          documentNumber
        });
        
        const response = await fetch(`/api/employee-verification/request-aadhar-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            documentId,
            documentNumber 
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          // Handle rate limiting (cooldown period)
          if (response.status === 429 && errorData.cooldownRemaining) {
            setCooldownSeconds(errorData.cooldownRemaining * 60);
            const timerId = setInterval(() => {
              setCooldownSeconds(prev => {
                if (prev === null || prev <= 1) {
                  clearInterval(timerId);
                  setCooldownTimerId(null);
                  return null;
                }
                return prev - 1;
              });
            }, 1000);
            setCooldownTimerId(timerId as unknown as number);
          }
          throw new Error(errorData.error || "Failed to request OTP");
        }
        
        const data = await response.json();
        console.log('OTP request successful:', data);
        
        if (data.success) {
          setTxnId(data.data?.txn_id);
          setShowOtpInput(true);
          toast({
            title: "OTP Sent",
            description: "An OTP has been sent to the registered mobile number"
          });
        }
      } catch (error) {
        console.error('Error requesting OTP:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to request OTP",
          variant: "destructive"
        });
      }
    } else {
      // For non-Aadhar documents, proceed with regular API verification
      onVerify('api');
      handleDialogClose();
    }
  };

  const handleOtpVerification = () => {
    onVerify('api');
    handleDialogClose();
  };

  return (
    <>
      <Dialog open={open && !showOtpInput} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Verification</DialogTitle>
            <DialogDescription>
              Choose a verification method for this {documentType?.replace('_', ' ')} document.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => {
                  onVerify('manual');
                  handleDialogClose();
                }}
                disabled={isVerifying}
                variant="outline"
              >
                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Manual Verification
              </Button>
              
              <Button 
                onClick={handleAadharApiClick}
                disabled={isVerifying || !!cooldownSeconds}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {cooldownSeconds ? (
                  `Wait ${Math.floor(cooldownSeconds / 60)}:${(cooldownSeconds % 60).toString().padStart(2, '0')}`
                ) : isVerifying ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  'API Verification'
                )}
              </Button>
            </div>
            
            <Button 
              onClick={() => {
                onReject();
                handleDialogClose();
              }}
              disabled={isVerifying}
              variant="destructive"
            >
              {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reject Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <OtpVerificationDialog
        open={showOtpInput}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
          setShowOtpInput(open);
        }}
        onVerify={handleOtpVerification}
        documentId={documentId}
        documentNumber={documentNumber}
        txnId={txnId}
      />
    </>
  );
};

export default VerificationDialog;
