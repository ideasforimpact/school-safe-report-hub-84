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
  onVerificationUpdate?: () => void;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ document, showVerifyButton, onVerificationUpdate }) => {
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [otherDocDialogOpen, setOtherDocDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);

  // Helper function to get the appropriate function name for each document type
  const getFunctionName = (documentTypeName?: string): string => {
    const typeName = documentTypeName?.toLowerCase();
    switch (typeName) {
      case 'bank_account':
      case 'bank_statement':
        return 'bank-statement-verification';
      case 'pan':
        return 'pan-verification';
      case 'driving_license':
        return 'driving-license-verification';
      case 'voter_id':
        return 'voter-id-verification';
      case 'other':
      case 'other_documents':
        return 'custom-document-verification';
      default:
        return 'pan-verification'; // Default fallback
    }
  };

  // Handle verification for different document types - Updated for new flow
  const handleVerify = async (method: 'api' | 'manual'): Promise<void> => {
    setIsVerifying(true);
    
    try {
      const documentTypeName = document.documentTypeName?.toLowerCase();
      console.log('Processing document:', { documentTypeName, method, documentId: document.id });
      
      let result;
      
      if (documentTypeName === 'other' || documentTypeName === 'other_documents') {
        // For other documents, show the custom verification dialog
        setOtherDocDialogOpen(true);
        setIsVerifying(false);
        return;
      }
      
      if (method === 'api') {
        // NEW BEHAVIOR: API calls should NOT update verification_status to 'verified'
        // They should store API response and set api_verification_status
        switch (documentTypeName) {
          case 'bank_account':
          case 'bank_statement':
            result = await supabase.functions.invoke('bank-statement-verification', {
              body: {
                action: 'apiCheck', // New action for API check without final verification
                documentId: document.id,
                accountNumber: document.documentNumber || '',
                ifscCode: document.details?.ifscCode || ''
              }
            });
            break;
            
          case 'pan':
            result = await supabase.functions.invoke('pan-verification', {
              body: {
                action: 'apiCheck', // New action for API check without final verification
                documentId: document.id,
                documentNumber: document.documentNumber || ''
              }
            });
            break;
            
          case 'driving_license':
            result = await supabase.functions.invoke('driving-license-verification', {
              body: {
                action: 'apiCheck', // New action for API check without final verification
                documentId: document.id,
                documentNumber: document.documentNumber || '',
                dateOfBirth: document.details?.dateOfBirth || ''
              }
            });
            break;
            
          case 'voter_id':
            result = await supabase.functions.invoke('voter-id-verification', {
              body: {
                action: 'apiCheck', // New action for API check without final verification
                documentId: document.id,
                documentNumber: document.documentNumber || ''
              }
            });
            break;
            
          default:
            throw new Error(`API verification not supported for document type: ${documentTypeName}`);
        }
        
        // Success message for API check completion
        toast({
          title: "API Check Complete",
          description: "Document has been processed. Check the API response for details.",
        });
      } else {
        // Handle manual verification - this still directly updates verification status
        const functionName = getFunctionName(documentTypeName);
        
        result = await supabase.functions.invoke(functionName, {
          body: {
            action: 'manualVerify',
            documentId: document.id,
            verification_notes: 'Manually verified'
          }
        });
        
        toast({
          title: "Document Verified",
          description: "Document has been manually verified.",
        });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      // Refresh the documents list
      onVerificationUpdate?.();
      
    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: method === 'api' ? "API Check Failed" : "Verification Failed", 
        description: error.message || `Failed to ${method === 'api' ? 'process' : 'verify'} document. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // REMOVED: handleReject function - reject button is hidden per new requirements

  if (!showVerifyButton) {
    return null;
  }

  // For 'other' and 'other_documents' types, use custom verification UI
  if (document.documentTypeName?.toLowerCase() === 'other' || 
      document.documentTypeName?.toLowerCase() === 'other_documents') {
    return (
      <>
        <div className="flex items-center space-x-2">
          <DocumentVerifyDropdown
            onVerify={handleVerify}
            documentTypeName={document.documentTypeName}
            isDisabled={isVerifying}
          />
        </div>
        
        <OtherDocumentVerificationDialog
          open={otherDocDialogOpen}
          onOpenChange={setOtherDocDialogOpen}
          documentId={document.id}
        />
      </>
    );
  }

  // For other document types, show verification dropdown ONLY (reject button removed)
  return (
    <div className="flex items-center space-x-2">
      <DocumentVerifyDropdown
        onVerify={handleVerify}
        documentTypeName={document.documentTypeName}
        isDisabled={isVerifying}
      />
      
      <VerificationDialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
        documentId={document.id}
        onVerificationUpdate={onVerificationUpdate}
      />

      {/* Bank statement details dialog for bank account verification */}
      {(document.documentTypeName?.toLowerCase() === 'bank_account' ||
        document.documentTypeName?.toLowerCase() === 'bank_statement') && (
        <BankStatementDetailsDialog
          open={bankDialogOpen}
          onOpenChange={setBankDialogOpen}
          documentId={document.id}
          onVerificationUpdate={onVerificationUpdate}
        />
      )}
    </div>
  );
};

export default DocumentActions;