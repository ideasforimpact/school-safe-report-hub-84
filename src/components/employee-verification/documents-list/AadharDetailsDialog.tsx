
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

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

  const documentType = aadharDetails?.documentType || 'aadhar';
  const isAadhar = documentType === 'aadhar';
  const isPan = documentType === 'pan';
  
  const renderDetails = () => {
    const timestamp = aadharDetails.timestamp ? 
      format(new Date(aadharDetails.timestamp), 'PPpp') : 
      'Unknown time';
    
    if (isAadhar) {
      const data = aadharDetails.response?.data || {};
      return (
        <div className="space-y-4 mt-4 text-sm">
          <div className="text-muted-foreground text-xs">
            Verified on {timestamp} via API
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-muted-foreground">Verification Method</div>
            <div className="font-medium">Digital API Verification</div>
            
            {data.client_id && (
              <>
                <div className="text-muted-foreground">Transaction Reference</div>
                <div className="font-medium">{data.client_id}</div>
              </>
            )}
          </div>
        </div>
      );
    } else if (isPan) {
      const data = aadharDetails.response?.data?.data || {};
      return (
        <div className="space-y-4 mt-4 text-sm">
          <div className="text-muted-foreground text-xs">
            Verified on {timestamp} via API
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-muted-foreground">Verification Method</div>
            <div className="font-medium">Digital API Verification</div>
            
            {data.name && (
              <>
                <div className="text-muted-foreground">Name</div>
                <div className="font-medium">{data.name}</div>
              </>
            )}
            
            {data.status && (
              <>
                <div className="text-muted-foreground">PAN Status</div>
                <div className="font-medium">{data.status}</div>
              </>
            )}
            
            {data.category && (
              <>
                <div className="text-muted-foreground">Category</div>
                <div className="font-medium">{data.category}</div>
              </>
            )}
            
            {data.last_updated && (
              <>
                <div className="text-muted-foreground">Last Updated</div>
                <div className="font-medium">{data.last_updated}</div>
              </>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4 mt-4 text-sm">
          <div className="text-muted-foreground text-xs">
            Verified on {timestamp} via API
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-muted-foreground">Verification Method</div>
            <div className="font-medium">Digital API Verification</div>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAadhar ? 'Aadhar' : isPan ? 'PAN' : 'Document'} Verification Details
          </DialogTitle>
          <DialogDescription>
            Information about the document verification process.
          </DialogDescription>
        </DialogHeader>
        
        {renderDetails()}
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AadharDetailsDialog;
