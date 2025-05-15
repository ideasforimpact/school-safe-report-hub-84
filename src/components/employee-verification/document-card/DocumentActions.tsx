
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';
import { VerificationDocument } from '@/types/employeeVerification';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface DocumentActionsProps {
  document: VerificationDocument;
  showVerifyButton?: boolean;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ document, showVerifyButton = true }) => {
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleVerify = async () => {
    if (isVerifying) return;
    
    setIsVerifying(true);
    try {
      await verifyDocument(
        document.id, 
        'verified'
      );
      
      toast({
        title: 'Document Verified',
        description: 'The document has been successfully verified.',
      });
    } catch (error) {
      console.error('Error verifying document:', error);
      toast({
        title: 'Verification Failed',
        description: 'There was an error verifying this document.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async () => {
    if (isRejecting) return;
    
    setIsRejecting(true);
    try {
      await verifyDocument(
        document.id, 
        'failed'
      );
      
      toast({
        title: 'Document Rejected',
        description: 'The document has been marked as rejected.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast({
        title: 'Rejection Failed',
        description: 'There was an error rejecting this document.',
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  if (!showVerifyButton) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
        onClick={handleVerify}
        disabled={isVerifying}
      >
        {isVerifying ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4 mr-1" />
        )}
        Verify
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleReject}
        disabled={isRejecting}
      >
        {isRejecting ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4 mr-1" />
        )}
        Reject
      </Button>
    </div>
  );
};

export default DocumentActions;
