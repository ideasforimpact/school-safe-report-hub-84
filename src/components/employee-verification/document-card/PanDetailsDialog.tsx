
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
import { FileText, User, Calendar, CreditCard, Fingerprint, CheckCircle, Loader2 } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();
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
    if (!documentId) return;
    
    try {
      setIsProcessing(true);
      await verifyDocument(documentId, 'verified', 'Verified after PAN API check');
      toast({
        title: "Document Verified",
        description: "PAN document has been successfully verified.",
      });
      onOpenChange(false);
      onVerificationUpdate?.();
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Failed to verify document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!documentId) return;
    
    try {
      setIsProcessing(true);
      await verifyDocument(documentId, 'failed', 'Rejected after PAN API check');
      toast({
        title: "Document Rejected",
        description: "PAN document has been rejected.",
      });
      onOpenChange(false);
      onVerificationUpdate?.();
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Reject Document"
            )}
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Verify Document"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PanDetailsDialog;
