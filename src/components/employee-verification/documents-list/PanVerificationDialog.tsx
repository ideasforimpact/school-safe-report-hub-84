
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, CheckCircle2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface PanVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentNumber: string;
  onVerificationComplete?: () => void;
}

const PanVerificationDialog: React.FC<PanVerificationDialogProps> = ({
  open,
  onOpenChange,
  documentId,
  documentNumber,
  onVerificationComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'api' | 'manual'>('api');
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const { toast } = useToast();

  const handleVerifyPan = async () => {
    setIsLoading(true);
    setVerificationResult(null);
    
    try {
      console.log(`Verifying PAN ${documentId} using ${verificationMethod}`);
      
      if (verificationMethod === 'api') {
        // API Verification - Call Supabase edge function
        const { data, error } = await supabase.functions.invoke('employee-verification/verify-pan', {
          method: 'POST',
          body: { 
            documentId,
            documentNumber
          }
        });
        
        if (error) {
          console.error('Error verifying PAN:', error);
          setVerificationResult({
            success: false,
            message: error.message || "Failed to verify PAN. Please try again.",
          });
          return;
        }
        
        if (data?.error) {
          setVerificationResult({
            success: false,
            message: data.error,
          });
          return;
        }
        
        // Success case
        setVerificationResult({
          success: true,
          message: "PAN card verified successfully.",
          details: data?.details || {}
        });
        
        toast({
          title: "Verification Successful",
          description: "PAN card has been successfully verified.",
        });
        
        if (onVerificationComplete) {
          onVerificationComplete();
        }
        
        // Close dialog after successful verification
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
        
      } else {
        // Manual Verification - Just mark as verified without verification
        const { data, error } = await supabase.functions.invoke('employee-verification/manual-verification', {
          method: 'POST',
          body: { 
            documentId,
            documentType: 'pan',
            notes: 'Manually verified by administrator'
          }
        });
        
        if (error) {
          console.error('Error with manual verification:', error);
          setVerificationResult({
            success: false,
            message: error.message || "Failed to manually verify PAN. Please try again.",
          });
          return;
        }
        
        setVerificationResult({
          success: true,
          message: "PAN card manually verified.",
        });
        
        toast({
          title: "Manual Verification Complete",
          description: "PAN card has been manually verified.",
        });
        
        if (onVerificationComplete) {
          onVerificationComplete();
        }
        
        // Close dialog after successful verification
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Exception in verifyPan:', err);
      setVerificationResult({
        success: false,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('employee-verification/reject-verification', {
        method: 'POST',
        body: { 
          documentId
        }
      });
      
      if (error) {
        console.error('Error rejecting document:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to reject document. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Document Rejected",
        description: "The document has been marked as failed verification.",
      });
      
      if (onVerificationComplete) {
        onVerificationComplete();
      }
      
      onOpenChange(false);
    } catch (err) {
      console.error('Exception in rejecting document:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-primary" />
            PAN Card Verification
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Verify this PAN card with the following number: <strong>{documentNumber}</strong>
          </p>
          
          {!verificationResult ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Verification Method</h3>
                <RadioGroup 
                  value={verificationMethod} 
                  onValueChange={(value) => setVerificationMethod(value as 'api' | 'manual')} 
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="api" id="api" />
                    <Label htmlFor="api">API Verification (Recommended)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manual" id="manual" />
                    <Label htmlFor="manual">Manual Verification</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleVerifyPan} 
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify PAN'
                  )}
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={isLoading}
                >
                  Reject
                </Button>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-md ${
              verificationResult.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex items-start">
                {verificationResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                ) : (
                  <X className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                )}
                <div>
                  <h3 className={`font-medium ${
                    verificationResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {verificationResult.success ? 'Verification Successful' : 'Verification Failed'}
                  </h3>
                  <p className="text-sm mt-1">
                    {verificationResult.message}
                  </p>
                  
                  {verificationResult.details && verificationResult.success && (
                    <div className="mt-3 text-sm space-y-1 border-t border-green-200 pt-2">
                      {verificationResult.details.name && (
                        <p><span className="font-medium">Name:</span> {verificationResult.details.name}</p>
                      )}
                      {verificationResult.details.father_name && (
                        <p><span className="font-medium">Father's Name:</span> {verificationResult.details.father_name}</p>
                      )}
                      {verificationResult.details.dob && (
                        <p><span className="font-medium">Date of Birth:</span> {verificationResult.details.dob}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {verificationResult && verificationResult.success ? 'Close' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PanVerificationDialog;
