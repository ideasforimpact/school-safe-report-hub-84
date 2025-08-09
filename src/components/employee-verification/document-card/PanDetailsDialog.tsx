
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { FileText, User, Calendar, CreditCard, Fingerprint, CheckCircle, Loader2, X } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification/EmployeeVerificationContext';
import { useToast } from '@/hooks/use-toast';

interface PanDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panDetails: any;
  documentId?: string;
  onVerificationUpdate?: () => void;
}

const PanDetailsDialog: React.FC<PanDetailsDialogProps> = ({
  open,
  onOpenChange,
  panDetails,
  documentId,
  onVerificationUpdate
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();
  
  // Debug logging 
  console.log('PanDetailsDialog - Props:', { open, documentId, onVerificationUpdate, panDetails });
  
  if (!panDetails || !panDetails.data) {
    return null;
  }

  const {
    data: {
      pan_number,
      full_name,
      masked_aadhaar,
      gender,
      dob,
      aadhaar_linked,
      status
    }
  } = panDetails;

  // Format date if available
  const formattedDob = dob ? format(new Date(dob), 'dd MMM yyyy') : 'Not available';

  const handleVerify = async () => {
    // console.log('PanDetailsDialog - handleVerify called, documentId:', documentId);
    if (!documentId) {
      // console.log('PanDetailsDialog - No documentId, exiting');
      return;
    }
    
    try {
      setIsApproving(true);
      // console.log('PanDetailsDialog - Calling verifyDocument with:', documentId, 'verified');
      await verifyDocument(documentId, 'verified', 'manual', 'Verified after PAN API check');
      toast({
        title: "Document Approved",
        description: "PAN document has been successfully approved.",
      });
      onOpenChange(false);
      onVerificationUpdate?.();
    } catch (error) {
      console.error('PanDetailsDialog - Verification error:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    // console.log('PanDetailsDialog - handleReject called, documentId:', documentId);
    if (!documentId) {
      // console.log('PanDetailsDialog - No documentId, exiting');
      return;
    }
    
    try {
      setIsRejecting(true);
      // console.log('PanDetailsDialog - Calling verifyDocument with:', documentId, 'failed');
      await verifyDocument(documentId, 'failed', 'manual', 'Rejected after PAN API check');
      toast({
        title: "Document Rejected",
        description: "PAN document has been rejected.",
      });
      onOpenChange(false);
      onVerificationUpdate?.();
    } catch (error) {
      console.error('PanDetailsDialog - Rejection error:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-blue-600" />
            PAN Card Verification Details
          </DialogTitle>
          <DialogDescription>
            Governance verified data from the API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <Card className="border border-green-100 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Verification Status:</span>
                <div className="flex items-center gap-1 text-green-700 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  {status === 'valid' ? 'Valid PAN' : status}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">PAN Number:</span>
              <span className="text-sm ml-auto font-mono">{pan_number}</span>
            </div>
            
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Full Name:</span>
              <span className="text-sm ml-auto">{full_name}</span>
            </div>
            
            {gender && (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Gender:</span>
                <span className="text-sm ml-auto">{gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Date of Birth:</span>
              <span className="text-sm ml-auto">{formattedDob}</span>
            </div>
            
            {masked_aadhaar && (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <Fingerprint className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Aadhaar Status:</span>
                <div className="flex items-center ml-auto">
                  {aadhaar_linked && <CheckCircle className="h-4 w-4 text-green-600 mr-1" />}
                  <span className="text-sm">{masked_aadhaar}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              // console.log('PanDetailsDialog - Reject button clicked');
              handleReject();
            }}
            disabled={isRejecting || isApproving}
            className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Reject
          </Button>
          <Button
            onClick={() => {
              // console.log('PanDetailsDialog - Approve button clicked');
              handleVerify();
            }}
            disabled={isApproving || isRejecting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PanDetailsDialog;
