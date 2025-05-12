
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
  onReject: () => void;
  isVerifying: boolean;
  documentType?: string;
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({
  open,
  onOpenChange,
  onVerify,
  onReject,
  isVerifying,
  documentType = ''
}) => {
  const isAadhar = documentType === 'aadhar';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Document</DialogTitle>
          <DialogDescription>
            Choose a verification method for this {documentType || 'document'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4">
          <Button 
            variant="outline" 
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 justify-start"
            onClick={() => onVerify('api')}
            disabled={isVerifying}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            {isAadhar ? 'Verify via Aadhar API (Requires OTP)' : 'Verify via API'}
            <span className="ml-auto text-xs text-blue-500 font-normal">
              {isAadhar ? 'OTP verification' : 'Automated check'}
            </span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 justify-start"
            onClick={() => onVerify('manual')}
            disabled={isVerifying}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Verify Manually
            <span className="ml-auto text-xs text-purple-500 font-normal">Manual review completed</span>
          </Button>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            onClick={onReject}
            disabled={isVerifying}
          >
            Reject
          </Button>
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
