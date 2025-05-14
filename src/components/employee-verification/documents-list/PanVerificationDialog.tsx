
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PanVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentNumber: string;
  onVerificationComplete: () => void;
  // For backward compatibility
  isOpen?: boolean;
  onClose?: () => void;
}

const PanVerificationDialog: React.FC<PanVerificationDialogProps> = ({
  open,
  onOpenChange,
  documentId,
  documentNumber,
  onVerificationComplete,
  // Handle legacy props
  isOpen,
  onClose
}) => {
  // Use either new or legacy props
  const isDialogOpen = open || isOpen || false;
  const handleDialogChange = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen);
    if (!newOpen && onClose) onClose();
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success?: boolean;
    message?: string;
    details?: any;
  }>({});
  const { toast } = useToast();

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('employee-verification', {
        method: 'POST',
        body: { 
          action: 'verifyPan',
          documentId,
          documentNumber
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('PAN verification response:', data);
      
      setVerificationResult({
        success: data.success,
        message: data.message,
        details: data.details
      });

      if (data.success) {
        toast({
          title: "Verification Successful",
          description: "PAN card has been verified successfully.",
        });

        // Let parent know verification was successful
        setTimeout(() => {
          onVerificationComplete();
          handleDialogChange(false);
        }, 2000);
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "Failed to verify PAN card.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying PAN card:', error);
      setVerificationResult({
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      });
      
      toast({
        title: "Error",
        description: "Failed to verify PAN card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-500" />
            PAN Card Verification
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!verificationResult.success && !verificationResult.message && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-4">
                Verify this PAN card through the government database?
              </p>
              <p className="text-xs bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800">
                <AlertCircle className="h-4 w-4 inline-block mr-1" />
                This will validate the PAN card details against official records.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-gray-600">Verifying PAN card...</p>
            </div>
          )}

          {verificationResult.success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-start">
                <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-green-800">Verification Successful</h4>
                  <p className="text-sm text-green-700 mt-1">{verificationResult.message}</p>
                  
                  {verificationResult.details && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <h5 className="text-sm font-medium text-green-800 mb-1">Details verified:</h5>
                      <ul className="text-xs text-green-700">
                        {verificationResult.details.name && <li>Name: {verificationResult.details.name}</li>}
                        {verificationResult.details.father_name && <li>Father's Name: {verificationResult.details.father_name}</li>}
                        {verificationResult.details.dob && <li>Date of Birth: {verificationResult.details.dob}</li>}
                        {verificationResult.details.pan_status && <li>Status: {verificationResult.details.pan_status}</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {verificationResult.success === false && verificationResult.message && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-red-800">Verification Failed</h4>
                  <p className="text-sm text-red-700 mt-1">{verificationResult.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => handleDialogChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          {!verificationResult.success && !verificationResult.message && (
            <Button 
              onClick={handleVerify}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Verify PAN
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PanVerificationDialog;
