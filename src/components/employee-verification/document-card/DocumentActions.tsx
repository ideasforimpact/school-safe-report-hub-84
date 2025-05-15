
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/components/ui/use-toast';
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
      // Special logic for PAN documents
      if (document.documentTypeName === 'pan') {
        if (method === 'api') {
          // Handle PAN API verification using our new edge function
          const { data, error } = await supabase.functions.invoke('pan-verification', {
            body: {
              action: 'apiVerify',
              documentId: document.id,
              documentNumber: document.documentNumber
            }
          });
          
          if (error) {
            throw new Error(error.message || 'PAN verification failed');
          }
          
          toast({
            title: data.success ? "PAN Verified" : "Verification Failed",
            description: data.message || (data.success ? "Document has been verified via API." : "Document verification failed."),
            variant: data.success ? "default" : "destructive",
          });
          
          setIsVerifying(false);
          return;
        } else if (method === 'manual') {
          // Handle PAN manual verification
          const { data, error } = await supabase.functions.invoke('pan-verification', {
            body: {
              action: 'manualVerify',
              documentId: document.id,
              verification_notes: 'Document manually verified by staff.'
            }
          });
          
          if (error) {
            throw new Error(error.message || 'Manual verification failed');
          }
          
          toast({
            title: "Document Verified",
            description: "Document has been manually verified successfully.",
          });
          
          setIsVerifying(false);
          return;
        }
      }
      
      // For other document types or fallback handling
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
        description: error instanceof Error ? error.message : "An error occurred while verifying the document.",
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
      // Special handling for PAN documents
      if (document.documentTypeName === 'pan') {
        // Use the pan-verification edge function
        const { data, error } = await supabase.functions.invoke('pan-verification', {
          body: {
            action: 'reject',
            documentId: document.id,
            verification_notes: 'Document verification rejected by staff.'
          }
        });
        
        if (error) {
          throw new Error(error.message || 'Rejection failed');
        }
        
        toast({
          title: "Verification Rejected",
          description: "Document has been marked as failed verification.",
          variant: "destructive",
        });
        
        setIsVerifying(false);
        return;
      }
      
      // For other document types
      await verifyDocument(document.id, 'failed', 'Document verification failed. Details do not match records.');
      
      toast({
        title: "Verification Failed",
        description: "Document has been marked as failed verification.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while rejecting the document.",
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
