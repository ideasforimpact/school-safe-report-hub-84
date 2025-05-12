
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldCheck, Shield } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';
import { VerificationDocument } from '@/types/employeeVerification';
import OtpVerificationDialog from '../documents-list/OtpVerificationDialog';

interface DocumentActionsProps {
  document: VerificationDocument;
  showVerifyButton?: boolean;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ document, showVerifyButton = true }) => {
  const [verifying, setVerifying] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();

  const isAadhar = document.documentType === 'aadhar';

  const handleVerify = async (status: 'verified' | 'failed', method: 'api' | 'manual') => {
    // For Aadhar documents that need OTP verification
    if (isAadhar && method === 'api' && status === 'verified') {
      setOtpDialogOpen(true);
      return;
    }
    
    setVerifying(true);
    try {
      // In a real app, this would call an API to verify the document
      setTimeout(() => {
        const notes = status === 'verified' 
          ? `Document ${method === 'api' ? 'automatically' : 'manually'} verified successfully.` 
          : 'Failed to verify document. Details do not match records.';
        
        verifyDocument(
          document.id, 
          status, 
          notes
        );
        
        toast({
          title: status === 'verified' ? 'Document Verified' : 'Verification Failed',
          description: status === 'verified' 
            ? `The document has been ${method === 'api' ? 'automatically' : 'manually'} verified successfully.` 
            : 'Document verification failed.',
        });
        setVerifying(false);
      }, 1500); // Simulate API delay
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during verification.',
        variant: 'destructive',
      });
      setVerifying(false);
    }
  };

  const handleOtpVerificationComplete = (success: boolean, message: string) => {
    if (success) {
      verifyDocument(
        document.id,
        'verified',
        'Document verified successfully via Aadhar OTP verification.'
      );
      
      toast({
        title: "Document Verified",
        description: message,
      });
    } else {
      toast({
        title: "Verification Failed",
        description: message,
        variant: "destructive"
      });
    }
  };

  if (document.verificationStatus !== 'pending' || !showVerifyButton) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 w-full">
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium">Auto Verification</p>
        <Button 
          variant="outline" 
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          onClick={() => handleVerify('verified', 'api')}
          disabled={verifying}
        >
          <ShieldCheck className="h-4 w-4 mr-2" />
          {isAadhar ? 'Verify with OTP' : 'Verify API'}
        </Button>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium">Manual Verification</p>
        <Button 
          variant="outline" 
          className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
          onClick={() => handleVerify('verified', 'manual')}
          disabled={verifying}
        >
          <Shield className="h-4 w-4 mr-2" />
          Verify Manual
        </Button>
      </div>
      <div className="lg:col-span-2">
        <Button 
          variant="outline" 
          className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
          onClick={() => handleVerify('failed', 'manual')}
          disabled={verifying}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Reject
        </Button>
      </div>

      <OtpVerificationDialog 
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        documentId={document.id}
        documentNumber={document.documentNumber}
        onVerificationComplete={handleOtpVerificationComplete}
      />
    </div>
  );
};

export default DocumentActions;
