
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';
import DocumentVerifyDropdown from './DocumentVerifyDropdown';

interface DocumentActionsProps {
  document: VerificationDocument;
  showVerifyButton: boolean;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ document, showVerifyButton }) => {
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [showPanVerification, setShowPanVerification] = React.useState(false);
  const [showAadharVerification, setShowAadharVerification] = React.useState(false);

  const handleVerify = async (method: 'api' | 'manual') => {
    setIsVerifying(true);
    
    try {
      // Special logic for Aadhar documents
      if (document.documentTypeName === 'aadhar' && method === 'api') {
        setShowAadharVerification(true);
        setIsVerifying(false);
        return;
      }
      
      // Special logic for PAN documents
      if (document.documentTypeName === 'pan' && method === 'api') {
        setShowPanVerification(true);
        setIsVerifying(false);
        return;
      }
      
      // For other document types or manual verification
      const notes = method === 'api' 
        ? 'Document automatically verified with government database.' 
        : 'Document manually verified by staff.';
      
      // Update verification_status to 'success' for manual verification
      await verifyDocument(document.id, 'verified', notes);
      
      toast({
        title: "Document Verified",
        description: `Document has been ${method === 'api' ? 'automatically' : 'manually'} verified successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while verifying the document.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async () => {
    setIsVerifying(true);
    
    try {
      // When rejecting, we set verification_status to 'failed'
      await verifyDocument(document.id, 'failed', 'Document verification failed. Details do not match records.');
      
      toast({
        title: "Verification Failed",
        description: "Document has been marked as failed verification.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while rejecting the document.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!showVerifyButton) {
    return null;
  }

  return (
    <div className="flex space-x-2">
      <DocumentVerifyDropdown 
        onVerify={handleVerify} 
        documentTypeName={document.documentTypeName || ''}
        isDisabled={isVerifying}
      />
      
      <Button 
        variant="outline" 
        size="sm" 
        className="text-red-600 border-red-200 hover:bg-red-50"
        onClick={handleReject}
        disabled={isVerifying}
      >
        <XCircle className="h-4 w-4 mr-1" />
        Reject
      </Button>
      
      {/* The Aadhar and PAN verification components will be rendered from the parent component */}
    </div>
  );
};

export default DocumentActions;
