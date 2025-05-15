
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';
import DocumentVerifyDropdown from './DocumentVerifyDropdown';
import { supabase } from '@/integrations/supabase/client';

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
      if (document.documentTypeName === 'aadhar' && method === 'api') {
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
      
      if (method === 'manual') {
        // Call the edge function for manual verification
        const { data, error } = await supabase.functions.invoke('employee-verification', {
          method: 'POST',
          body: { 
            action: 'manualVerification',
            documentId: document.id
          }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data?.error) {
          throw new Error(data.error);
        }
      } else {
        // For other document types or non-aadhar API verification
        const notes = method === 'api' 
          ? 'Document automatically verified with government database.' 
          : 'Document manually verified by staff.';
        
        // Update verification_status to 'success' for manual verification
        await verifyDocument(document.id, 'verified', notes);
      }
      
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
      // Call the edge function for rejection
      const { data, error } = await supabase.functions.invoke('employee-verification', {
        method: 'POST',
        body: { 
          action: 'rejectVerification',
          documentId: document.id
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
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
    </div>
  );
};

export default DocumentActions;
