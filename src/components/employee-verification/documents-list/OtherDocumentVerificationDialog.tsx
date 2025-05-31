
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OtherDocumentVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (method: 'manual') => void;
  onReject: () => void;
  isVerifying: boolean;
  documentId?: string;
}

const OtherDocumentVerificationDialog: React.FC<OtherDocumentVerificationDialogProps> = ({
  open,
  onOpenChange,
  onVerify,
  onReject,
  isVerifying,
  documentId = ''
}) => {
  const [isManualVerifying, setIsManualVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Handle Manual Verification
  const handleManualClick = async () => {
    setIsManualVerifying(true);
    
    try {
      //console.log("Initiating manual verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('other-document-verification', {
        body: {
          action: 'manualVerify',
          documentId,
          verification_notes: 'Document manually verified by staff.'
        }
      });
      
      //console.log("Manual verification response:", data, error);
      
      if (error) {
        console.error('Error manually verifying document:', error);
        toast.error("Verification Failed", {
          description: error.message || "Failed to manually verify document. Please try again."
        });
        return;
      }
      
      toast.success("Document Manually Verified", {
        description: "The document has been manually verified successfully."
      });
      onVerify('manual');
    } catch (err: any) {
      console.error("Exception in manual verification:", err);
      toast.error("Verification Error", {
        description: err.message || "Failed to manually verify document"
      });
    } finally {
      setIsManualVerifying(false);
    }
  };

  // Handle Rejection
  const handleRejectClick = async () => {
    setIsRejecting(true);
    
    try {
      //console.log("Rejecting verification for document ID:", documentId);
      
      const { data, error } = await supabase.functions.invoke('other-document-verification', {
        body: {
          action: 'reject',
          documentId,
          verification_notes: 'Document verification rejected by staff.'
        }
      });
      
      //console.log("Document rejection response:", data, error);
      
      if (error) {
        console.error('Error rejecting document:', error);
        toast.error("Rejection Failed", {
          description: error.message || "Failed to reject document. Please try again."
        });
        return;
      }
      
      toast.error("Document Rejected", {
        description: "The document has been marked as failed verification."
      });
      onReject();
    } catch (err: any) {
      console.error("Exception in rejection:", err);
      toast.error("Rejection Error", {
        description: err.message || "Failed to reject document"
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">Verify Document</DialogTitle>
          <DialogDescription className="text-center text-sm">
            Choose a verification method for this document.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button 
            variant="outline" 
            className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 justify-start"
            onClick={handleManualClick}
            disabled={isVerifying || isManualVerifying || isRejecting}
          >
            {isManualVerifying ? (
              <Loader2 className="h-4 w-4 mr-3 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {isManualVerifying ? 'Processing...' : 'Verify Manually'}
            <span className="ml-auto text-xs text-purple-500 font-normal">Manual review completed</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-200 justify-start"
            onClick={handleRejectClick}
            disabled={isVerifying || isManualVerifying || isRejecting}
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 mr-3 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {isRejecting ? 'Processing...' : 'Reject Document'}
            <span className="ml-auto text-xs text-red-500 font-normal">Document verification failed</span>
          </Button>
        </div>
        <DialogFooter className="flex justify-center sm:justify-end mt-4">
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isVerifying || isManualVerifying || isRejecting}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OtherDocumentVerificationDialog;
