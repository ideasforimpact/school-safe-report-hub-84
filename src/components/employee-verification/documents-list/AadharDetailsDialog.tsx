
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";

interface VerificationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aadharDetails: any | null;
}

// Component is still named AadharDetailsDialog for backward compatibility
// but now handles both Aadhar and PAN verification details
const AadharDetailsDialog: React.FC<VerificationDetailsDialogProps> = ({
  open,
  onOpenChange,
  aadharDetails
}) => {
  if (!aadharDetails) {
    return null;
  }
  
  const isAadharVerification = aadharDetails.action === 'verify_aadhar_otp';
  const isPanVerification = aadharDetails.action === 'pan_verification_success';

  let title = 'Verification Details';
  let responseData = aadharDetails.response?.data || {};
  
  if (isAadharVerification) {
    title = 'Aadhaar Verification Details';
  } else if (isPanVerification) {
    title = 'PAN Verification Details';
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Verification timestamp: {formatDate(aadharDetails.timestamp)}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-72 rounded border p-4">
          {isAadharVerification && (
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-sm">Method:</h3>
                <p className="text-sm">{aadharDetails.response?.method || "API"}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Verification Status:</h3>
                <p className="text-sm">Successful</p>
              </div>
              
              {responseData.aadhaar_number && (
                <div>
                  <h3 className="font-medium text-sm">Aadhaar:</h3>
                  <p className="text-sm">{responseData.aadhaar_number}</p>
                </div>
              )}
              
              {responseData.address && responseData.address.full && (
                <div>
                  <h3 className="font-medium text-sm">Address:</h3>
                  <p className="text-sm whitespace-pre-wrap">{responseData.address.full}</p>
                </div>
              )}
              
              {responseData.dob && (
                <div>
                  <h3 className="font-medium text-sm">Date of Birth:</h3>
                  <p className="text-sm">{responseData.dob}</p>
                </div>
              )}
              
              {responseData.gender && (
                <div>
                  <h3 className="font-medium text-sm">Gender:</h3>
                  <p className="text-sm">{responseData.gender === 'M' ? 'Male' : responseData.gender === 'F' ? 'Female' : responseData.gender}</p>
                </div>
              )}
              
              {responseData.name && (
                <div>
                  <h3 className="font-medium text-sm">Name:</h3>
                  <p className="text-sm">{responseData.name}</p>
                </div>
              )}
              
              {responseData.face_status && (
                <div>
                  <h3 className="font-medium text-sm">Face Match:</h3>
                  <p className="text-sm">{responseData.face_status}</p>
                </div>
              )}
              
              <div className="pt-2">
                <div className="text-xs text-muted-foreground">
                  Verified through Aadhaar OTP verification flow
                </div>
              </div>
            </div>
          )}
          
          {isPanVerification && (
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-sm">Method:</h3>
                <p className="text-sm">{aadharDetails.response?.method || "API"}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Verification Status:</h3>
                <p className="text-sm">Successful</p>
              </div>
              
              {responseData.data?.name && (
                <div>
                  <h3 className="font-medium text-sm">Name:</h3>
                  <p className="text-sm">{responseData.data.name}</p>
                </div>
              )}

              {responseData.data?.pan_number && (
                <div>
                  <h3 className="font-medium text-sm">PAN Number:</h3>
                  <p className="text-sm">{responseData.data.pan_number}</p>
                </div>
              )}
              
              {responseData.data?.status && (
                <div>
                  <h3 className="font-medium text-sm">PAN Status:</h3>
                  <p className="text-sm capitalize">{responseData.data.status}</p>
                </div>
              )}
              
              {responseData.data?.category && (
                <div>
                  <h3 className="font-medium text-sm">Category:</h3>
                  <p className="text-sm capitalize">{responseData.data.category}</p>
                </div>
              )}

              {responseData.data?.aadhaar_linked !== undefined && (
                <div>
                  <h3 className="font-medium text-sm">Aadhaar Linked:</h3>
                  <p className="text-sm">{responseData.data.aadhaar_linked ? "Yes" : "No"}</p>
                </div>
              )}
              
              {responseData.data?.dob && (
                <div>
                  <h3 className="font-medium text-sm">Date of Birth:</h3>
                  <p className="text-sm">{responseData.data.dob}</p>
                </div>
              )}

              {responseData.data?.gender && (
                <div>
                  <h3 className="font-medium text-sm">Gender:</h3>
                  <p className="text-sm">{responseData.data.gender === 'M' ? 'Male' : responseData.data.gender === 'F' ? 'Female' : responseData.data.gender}</p>
                </div>
              )}
              
              <div className="pt-2">
                <div className="text-xs text-muted-foreground">
                  Verified through PAN verification API
                </div>
              </div>
            </div>
          )}
          
          {!isAadharVerification && !isPanVerification && (
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-sm">Action:</h3>
                <p className="text-sm">{aadharDetails.action || "Unknown"}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Timestamp:</h3>
                <p className="text-sm">{formatDate(aadharDetails.timestamp)}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Data:</h3>
                <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(aadharDetails.response || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AadharDetailsDialog;
