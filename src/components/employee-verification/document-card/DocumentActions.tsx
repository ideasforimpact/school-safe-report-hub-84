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
        return 'bank-statement';
      case 'pan':
        return 'pan-verification';
      case 'aadhar':
        return 'employee-verification';
      case 'driving_license':
        return 'driving-license';
      case 'voter_id':
        return 'voter-verification';
      case 'other':
      case 'other_documents':
        return 'other-document-verification';
      default:
        return 'other-document-verification'; // Default fallback
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
        // API calls should only update api_verification_status, not verification_status
        switch (documentTypeName) {
          case 'aadhar':
            result = await supabase.functions.invoke('employee-verification', {
              body: {
                action: 'requestAadharOtp',
                documentId: document.id,
                aadharNumber: document.documentNumber || ''
              }
            });
            break;
            
          case 'bank_account':
          case 'bank_statement':
            result = await supabase.functions.invoke('bank-statement', {
              body: {
                action: 'verify',
                documentId: document.id,
                accountNumber: document.documentNumber || '',
                ifscCode: document.details?.ifscCode || ''
              }
            });
            break;
            
          case 'pan':
            result = await supabase.functions.invoke('pan-verification', {
              body: {
                action: 'verify',
                documentId: document.id,
                panNumber: document.documentNumber || ''
              }
            });
            break;
            
          case 'driving_license':
            result = await supabase.functions.invoke('driving-license', {
              body: {
                action: 'verify',
                documentId: document.id,
                documentNumber: document.documentNumber || '',
                dateOfBirth: document.details?.dateOfBirth || ''
              }
            });
            break;
            
          case 'voter_id':
            result = await supabase.functions.invoke('voter-verification', {
              body: {
                action: 'verify',
                documentId: document.id,
                voterIdNumber: document.documentNumber || ''
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
        // Handle manual verification - this updates verification_status directly
        result = await supabase.functions.invoke('other-document-verification', {
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
          onVerify={() => handleVerify('manual')}
          onReject={() => {}} // Empty function since reject is removed
          isVerifying={isVerifying}
          documentId={document.id}
          documentType={document.documentTypeName}
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
        onVerify={handleVerify}
        onReject={() => {}} // Empty function since reject is removed
        isVerifying={isVerifying}
        documentType={document.documentTypeName}
        documentId={document.id}
        documentNumber={document.documentNumber}
      />

      {/* Bank statement details dialog for bank account verification */}
      {(document.documentTypeName?.toLowerCase() === 'bank_account' ||
        document.documentTypeName?.toLowerCase() === 'bank_statement') && (
        <BankStatementDetailsDialog
          open={bankDialogOpen}
          onOpenChange={setBankDialogOpen}
          statementDetails={null}
          documentId={document.id}
        />
      )}
    </div>
  );
};

export default DocumentActions;