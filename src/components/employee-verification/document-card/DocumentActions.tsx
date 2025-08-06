import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';
import DocumentVerifyDropdown from './DocumentVerifyDropdown';
import { supabase } from '@/integrations/supabase/client';
import VerificationDialog from '../documents-list/VerificationDialog';
import BankStatementDetailsDialog from '../document-card/BankStatementDetailsDialog';
import OtherDocumentVerificationDialog from '../documents-list/OtherDocumentVerificationDialog';

interface DocumentActionsProps {
  document: VerificationDocument;
  showVerifyButton: boolean;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ document, showVerifyButton }) => {
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [otherDocDialogOpen, setOtherDocDialogOpen] = useState(false);
  const [bankStatementDetailsOpen, setBankStatementDetailsOpen] = useState(false);
  const [bankStatementDetails, setBankStatementDetails] = useState<any>(null);

  const handleVerify = async (method: 'api' | 'manual') => {
    setIsVerifying(true);
    
    try {
      // Special logic for Other document types (both 'other' and 'other_documents')
      if (document.documentTypeName === 'other' || document.documentTypeName === 'other_documents') {
        if (method === 'manual') {
          const functionName = document.documentTypeName === 'other_documents' 
            ? 'custom-document-verification' 
            : 'other-document-verification';
          
          const { data, error } = await supabase.functions.invoke(functionName, {
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
          setOtherDocDialogOpen(false);
          return;
        }
      }
      
      // Special logic for Bank Account documents
      if (document.documentTypeName === 'bank_account') {
        if (method === 'api') {
          const { data, error } = await supabase.functions.invoke('bank-statement', {
            body: {
              action: 'apiVerify',
              documentId: document.id
            }
          });
          
          console.log("Bank Statement API verification response:", data, error);
          
          if (error) {
            throw new Error(error.message || 'Bank statement verification failed');
          }
          
          toast({
            title: data.success ? "Bank Statement Verified" : "Verification Failed",
            description: data.message || (data.success ? "Document has been verified via API." : "Document verification failed."),
            variant: data.success ? "default" : "destructive",
          });
          
          // If successful, show the details dialog
          if (data.success) {
            setBankStatementDetails(data);
            setBankStatementDetailsOpen(true);
          }
          
          setIsVerifying(false);
          setDialogOpen(false);
          return;
        } else if (method === 'manual') {
          const { data, error } = await supabase.functions.invoke('bank-statement', {
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
          setDialogOpen(false);
          return;
        }
      }
      
      // Special logic for PAN documents
      else if (document.documentTypeName === 'pan') {
        // Handle PAN API verification using our edge function
        if (method === 'api') {
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
          setDialogOpen(false);
          return;
        } else if (method === 'manual') {
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
          setDialogOpen(false);
          return;
        }
      }
      // Special logic for Driving License
      else if (document.documentTypeName === 'driving_license') {
        if (method === 'api') {
          const { data, error } = await supabase.functions.invoke('driving-license', {
            body: {
              action: 'apiVerify',
              documentId: document.id
            }
          });
          
          if (error) {
            throw new Error(error.message || 'Driving license verification failed');
          }
          
          toast({
            title: data.success ? "Driving License Verified" : "Verification Failed",
            description: data.message || (data.success ? "Document has been verified via API." : "Document verification failed."),
            variant: data.success ? "default" : "destructive",
          });
          
          setIsVerifying(false);
          setDialogOpen(false);
          return;
        } else if (method === 'manual') {
          const { data, error } = await supabase.functions.invoke('driving-license', {
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
          setDialogOpen(false);
          return;
        }
      }
      // Special logic for Voter ID documents
      else if (document.documentTypeName === 'voter_id') {
        if (method === 'api') {
          const { data, error } = await supabase.functions.invoke('voter-verification', {
            body: {
              action: 'apiVerify',
              documentId: document.id,
              documentNumber: document.documentNumber
            }
          });
          
          if (error) {
            throw new Error(error.message || 'Voter ID verification failed');
          }
          
          toast({
            title: data.success ? "Voter ID Verified" : "Verification Failed",
            description: data.message || (data.success ? "Document has been verified via API." : "Document verification failed."),
            variant: data.success ? "default" : "destructive",
          });
          
          setIsVerifying(false);
          setDialogOpen(false);
          return;
        } else if (method === 'manual') {
          const { data, error } = await supabase.functions.invoke('voter-verification', {
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
          setDialogOpen(false);
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
      
      setDialogOpen(false);
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
      // Special handling for Other document types (both 'other' and 'other_documents')
      if (document.documentTypeName === 'other' || document.documentTypeName === 'other_documents') {
        const functionName = document.documentTypeName === 'other_documents' 
          ? 'custom-document-verification' 
          : 'other-document-verification';
        
        const { data, error } = await supabase.functions.invoke(functionName, {
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
        setOtherDocDialogOpen(false);
        return;
      }
      
      // Special handling for Bank Account
      if (document.documentTypeName === 'bank_account') {
        const { data, error } = await supabase.functions.invoke('bank-statement', {
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
        setDialogOpen(false);
        return;
      }
      
      // Special handling for PAN documents
      else if (document.documentTypeName === 'pan') {
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
        setDialogOpen(false);
        return;
      }
      // Special handling for Driving License
      else if (document.documentTypeName === 'driving_license') {
        const { data, error } = await supabase.functions.invoke('driving-license', {
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
        setDialogOpen(false);
        return;
      }
      // Special handling for Voter ID
      else if (document.documentTypeName === 'voter_id') {
        const { data, error } = await supabase.functions.invoke('voter-verification', {
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
        setDialogOpen(false);
        return;
      }
      
      // For other document types
      await verifyDocument(document.id, 'failed', 'Document verification failed. Details do not match records.');
      
      toast({
        title: "Verification Failed",
        description: "Document has been marked as failed verification.",
        variant: "destructive",
      });
      
      setDialogOpen(false);
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

  // Debug: Log document type name
  console.log('DocumentActions - documentTypeName:', document.documentTypeName, 'documentTypeId:', document.documentTypeId);
  console.log('DocumentActions - Check conditions:');
  console.log('  - documentTypeName === other:', document.documentTypeName === 'other');
  console.log('  - documentTypeName === other_documents:', document.documentTypeName === 'other_documents');
  console.log('  - documentTypeId === 8:', document.documentTypeId === '8');
  
  // For 'other' and 'other_documents' document types - show a custom button with only manual verification option
  const docTypeName = (document.documentTypeName || '').toLowerCase().trim();
  if (docTypeName === 'other' || 
      docTypeName === 'other_documents' || 
      document.documentTypeId === '8') {
    console.log('DocumentActions - Using OtherDocumentVerificationDialog for:', document.documentTypeName);
    return (
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={() => setOtherDocDialogOpen(true)}
          disabled={isVerifying}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Verify
        </Button>
        
        <OtherDocumentVerificationDialog
          open={otherDocDialogOpen}
          onOpenChange={setOtherDocDialogOpen}
          onVerify={handleVerify}
          onReject={handleReject}
          isVerifying={isVerifying}
          documentId={document.id}
          documentType={document.documentTypeName}
        />
      </div>
    );
  }

  // For other document types, use the regular verification dialog
  console.log('DocumentActions - Using regular VerificationDialog for:', document.documentTypeName);
  return (
    <div className="flex space-x-2">
      <DocumentVerifyDropdown
        onVerify={handleVerify}
        documentTypeName={document.documentTypeName}
        isDisabled={isVerifying}
      />
      
      <VerificationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onVerify={handleVerify}
        onReject={handleReject}
        isVerifying={isVerifying}
        documentType={document.documentTypeName || ''}
        documentId={document.id}
        documentNumber={document.documentNumber}
      />

      {document.documentTypeName === 'bank_account' && (
        <BankStatementDetailsDialog
          open={bankStatementDetailsOpen}
          onOpenChange={setBankStatementDetailsOpen}
          statementDetails={bankStatementDetails}
          documentId={document.id}
        />
      )}
    </div>
  );
};

export default DocumentActions;
