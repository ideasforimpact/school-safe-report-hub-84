import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (method: 'api' | 'manual') => void;
  onReject: () => void; // Keep interface for compatibility but won't use
  isVerifying: boolean;
  documentType?: string;
  documentId?: string;
  documentNumber?: string;
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({
  open,
  onOpenChange,
  onVerify,
  onReject, // Keep for compatibility but ignore
  isVerifying,
  documentType = '',
  documentId = '',
  documentNumber = ''
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">Process Document</DialogTitle>
          <DialogDescription className="text-center text-sm">
            Choose how to process this {documentType || 'document'} verification.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button 
            variant="outline" 
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 justify-start"
            onClick={() => {
              onVerify('api');
              onOpenChange(false);
            }}
            disabled={isVerifying}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            API Verification
            <span className="ml-auto text-xs text-blue-500 font-normal">Automated check</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 justify-start"
            onClick={() => {
              onVerify('manual');
              onOpenChange(false);
            }}
            disabled={isVerifying}
          >
            <ShieldCheck className="h-4 w-4 mr-3" />
            Manual Verification
            <span className="ml-auto text-xs text-purple-500 font-normal">Manual review</span>
          </Button>
        </div>
        <DialogFooter className="flex justify-center sm:justify-end mt-4">
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isVerifying}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationDialog;