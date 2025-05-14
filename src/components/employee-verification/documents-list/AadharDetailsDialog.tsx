
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AadharDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aadharDetails: any;
}

const AadharDetailsDialog: React.FC<AadharDetailsDialogProps> = ({
  open,
  onOpenChange,
  aadharDetails
}) => {
  if (!aadharDetails) {
    return null;
  }

  const isPanVerification = aadharDetails.action === 'pan_verification_success';
  const isAadharVerification = aadharDetails.action === 'verify_aadhar_otp';
  
  const title = isPanVerification 
    ? 'PAN Verification Details' 
    : isAadharVerification 
      ? 'Aadhaar Verification Details'
      : 'Document Verification Details';

  const renderVerificationDetails = () => {
    if (isPanVerification) {
      const panData = aadharDetails.response?.data || {};
      return (
        <>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="font-medium">Name:</div>
            <div>{panData.name || 'N/A'}</div>
            
            <div className="font-medium">PAN Status:</div>
            <div>{panData.status || 'N/A'}</div>

            <div className="font-medium">Category:</div>
            <div>{panData.category || 'N/A'}</div>

            <div className="font-medium">Last Updated:</div>
            <div>{panData.last_updated ? formatDate(panData.last_updated) : 'N/A'}</div>
            
            <div className="font-medium">Verification Date:</div>
            <div>{aadharDetails.timestamp ? formatDate(aadharDetails.timestamp) : 'N/A'}</div>
          </div>
          <div className="mt-4 p-2 bg-gray-50 rounded-md">
            <div className="font-medium mb-2">Verification Method:</div>
            <div className="text-sm">Government Database API Verification</div>
          </div>
        </>
      );
    } else if (isAadharVerification) {
      const aadharData = aadharDetails.response?.data || {};
      return (
        <>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="font-medium">Name:</div>
            <div>{aadharData.name || 'N/A'}</div>
            
            <div className="font-medium">Gender:</div>
            <div>{aadharData.gender || 'N/A'}</div>
            
            <div className="font-medium">DOB:</div>
            <div>{aadharData.dob || 'N/A'}</div>
            
            <div className="font-medium">Address:</div>
            <div className="break-words">{aadharData.address || 'N/A'}</div>

            <div className="font-medium">Verification Date:</div>
            <div>{aadharDetails.timestamp ? formatDate(aadharDetails.timestamp) : 'N/A'}</div>
          </div>
          <div className="mt-4 p-2 bg-gray-50 rounded-md">
            <div className="font-medium mb-2">Verification Method:</div>
            <div className="text-sm">OTP Verification via Government Database</div>
          </div>
        </>
      );
    } else {
      return (
        <div className="text-center py-4">
          No detailed verification information available for this document.
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        
        {renderVerificationDetails()}
        
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AadharDetailsDialog;
