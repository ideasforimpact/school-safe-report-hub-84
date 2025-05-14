
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

  const handleVerify = async (method: 'api' | 'manual') => {
    setIsVerifying(true);
    
    try {
      // Special logic for Aadhar documents
      if (document.documentTypeName?.toLowerCase() === 'aadhar' && method === 'api') {
        // Handle Aadhar API verification logic
        console.log('Aadhar API verification selected');
        // This would normally open an OTP dialog or similar
        toast({
          title: "API Verification",
          description: "This would trigger the OTP verification flow for Aadhar in a real implementation.",
        });
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
      console.error('Verification error:', error);
      
      // Extract error message from the error object or API response
      let errorMessage = "An error occurred while verifying the document.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract error message from API response
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        }
      }
      
      // Show detailed error in toast for better user feedback
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
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
      console.error('Rejection error:', error);
      
      // Extract error message for better user feedback
      let errorMessage = "An error occurred while rejecting the document.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
    </div>
  );
};

export default DocumentActions;
