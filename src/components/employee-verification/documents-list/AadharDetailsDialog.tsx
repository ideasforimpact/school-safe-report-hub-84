
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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
  if (!aadharDetails) return null;
  
  // Determine if this is Aadhar or PAN data based on structure
  const isPanVerification = aadharDetails.data?.pan_number || 
                           (aadharDetails.success && aadharDetails.data?.status);
  
  const renderPanDetails = () => {
    const data = aadharDetails.data;
    if (!data) return <p>No verification data available</p>;
    
    return (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50 rounded-md border border-blue-100">
          <span className="font-medium">PAN Number:</span>
          <span>{data.pan_number}</span>
          
          <span className="font-medium">Name:</span>
          <span>{data.full_name}</span>
          
          <span className="font-medium">Category:</span>
          <span>{data.category}</span>
          
          <span className="font-medium">Status:</span>
          <span className="font-semibold text-green-600">{data.status}</span>
          
          {data.masked_aadhaar && (
            <>
              <span className="font-medium">Masked Aadhaar:</span>
              <span>{data.masked_aadhaar}</span>
            </>
          )}
          
          {data.aadhaar_linked !== undefined && (
            <>
              <span className="font-medium">Aadhaar Linked:</span>
              <span>{data.aadhaar_linked ? 'Yes' : 'No'}</span>
            </>
          )}
          
          {data.dob && (
            <>
              <span className="font-medium">Date of Birth:</span>
              <span>{data.dob}</span>
            </>
          )}
          
          {data.gender && (
            <>
              <span className="font-medium">Gender:</span>
              <span>{data.gender === 'M' ? 'Male' : data.gender === 'F' ? 'Female' : data.gender}</span>
            </>
          )}
        </div>
        
        <div className="border-t pt-2 text-xs text-gray-500">
          <p>Verification completed via government API</p>
          {aadharDetails.message_code && (
            <p>Reference: {aadharDetails.message_code}</p>
          )}
        </div>
      </div>
    );
  };
  
  const renderAadharDetails = () => {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-gray-600">Aadhar verification was completed successfully. 
        The document has been verified with government records.</p>
        
        {aadharDetails.response?.data && (
          <div className="p-3 bg-green-50 rounded-md border border-green-100">
            <p className="font-medium">Verification Method: 
              <span className="ml-2 font-normal">OTP Verification</span>
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isPanVerification ? "PAN Verification Details" : "Aadhaar Verification Details"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {isPanVerification ? renderPanDetails() : renderAadharDetails()}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AadharDetailsDialog;
