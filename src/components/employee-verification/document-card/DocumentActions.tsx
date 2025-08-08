import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';
import DocumentVerifyDropdown from './DocumentVerifyDropdown';
import { supabase } from '@/integrations/supabase/client';
import BankStatementDetailsDialog from '../document-card/BankStatementDetailsDialog';
import ManualConsentDialog from '../common/ManualConsentDialog';
import { useAuth } from '@/contexts/auth';

interface DocumentActionsProps {
  document: VerificationDocument;
  showVerifyButton: boolean;
  onVerificationUpdate?: () => void;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ document, showVerifyButton, onVerificationUpdate }) => {
  const { verifyDocument, employees } = useEmployeeVerification();
  const { employeeData } = useAuth();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [manualConsentOpen, setManualConsentOpen] = useState(false);
  const [consentSuccess, setConsentSuccess] = useState<null | 'verified' | 'rejected'>(null);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);

  const employee = employees?.find((e) => e.id === document.employeeId);
  const employeeName = employee?.name || [employee?.firstName, employee?.lastName].filter(Boolean).join(' ') || 'Employee';

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
        return 'driving-license';
      case 'voter_id':
        return 'voter-verification';
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

      if (method === 'manual') {
        // Open consent dialog for all document types
        setManualConsentOpen(true);
        setIsVerifying(false);
        return;
      }

      // API verification path
      let result;
      switch (documentTypeName) {
        case 'bank_account':
        case 'bank_statement':
          result = await supabase.functions.invoke('bank-statement-verification', {
            body: {
              action: 'apiVerify',
              documentId: document.id,
              accountNumber: document.documentNumber || '',
              ifscCode: document.details?.ifscCode || ''
            }
          });
          break;

        case 'pan':
          result = await supabase.functions.invoke('pan-verification', {
            body: {
              action: 'apiVerify',
              documentId: document.id,
              documentNumber: document.documentNumber || '',
              verified_by_employee_id: employeeData?.id
            }
          });
          break;

        case 'driving_license':
          result = await supabase.functions.invoke('driving-license', {
            body: {
              action: 'apiVerify',
              documentId: document.id,
              documentNumber: document.documentNumber || '',
              dateOfBirth: document.details?.dateOfBirth || ''
            }
          });
          break;

        case 'voter_id':
          result = await supabase.functions.invoke('voter-verification', {
            body: {
              action: 'apiVerify',
              documentId: document.id,
              documentNumber: document.documentNumber || '',
              verified_by_employee_id: employeeData?.id
            }
          });
          break;

        default:
          throw new Error(`API verification not supported for document type: ${documentTypeName}`);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: 'API Check Complete',
        description: 'Document has been processed. Check the API response for details.',
      });

      onVerificationUpdate?.();
    } catch (error: any) {
      console.error('Processing error:', error);
      toast({
        title: 'API Check Failed',
        description: error.message || 'Failed to process document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualApprove = async (): Promise<void> => {
    setIsVerifying(true);
    try {
      const functionName = getFunctionName(document.documentTypeName);
      const result = await supabase.functions.invoke(functionName, {
        body: {
          action: 'manualVerify',
          documentId: document.id,
          verification_type: 'manual',
          verification_notes: 'Manually verified',
          verified_by_employee_id: employeeData?.id
        },
      });

      if (result.error) throw result.error;

      setConsentSuccess('verified');
      toast({ title: 'Document Verified', description: 'Document has been manually verified.' });
      onVerificationUpdate?.();

      setTimeout(() => {
        setManualConsentOpen(false);
        setConsentSuccess(null);
      }, 900);
    } catch (error: any) {
      console.error('Manual verification error:', error);
      toast({ title: 'Verification Failed', description: error.message || 'Failed to verify document.', variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualReject = async (): Promise<void> => {
    setIsVerifying(true);
    try {
      const functionName = getFunctionName(document.documentTypeName);
      const result = await supabase.functions.invoke(functionName, {
        body: {
          action: 'reject',
          documentId: document.id,
          verification_type: 'manual',
          verification_notes: 'Document verification rejected by staff.',
          verified_by_employee_id: employeeData?.id
        },
      });

      if (result.error) throw result.error;

      setConsentSuccess('rejected');
      toast({ title: 'Document Rejected', description: 'The document has been marked as failed.' });
      onVerificationUpdate?.();

      setTimeout(() => {
        setManualConsentOpen(false);
        setConsentSuccess(null);
      }, 900);
    } catch (error: any) {
      console.error('Rejection error:', error);
      toast({ title: 'Rejection Failed', description: error.message || 'Failed to reject document.', variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!showVerifyButton || document.verificationStatus === 'verified' || document.verificationStatus === 'failed') {
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
        
        <ManualConsentDialog
          open={manualConsentOpen}
          onOpenChange={setManualConsentOpen}
          documentTypeName={document.documentTypeName}
          employeeName={employeeName}
          onApprove={handleManualApprove}
          onReject={handleManualReject}
          isProcessing={isVerifying}
          successState={consentSuccess}
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
      
      <ManualConsentDialog
        open={manualConsentOpen}
        onOpenChange={setManualConsentOpen}
        documentTypeName={document.documentTypeName}
        employeeName={employeeName}
        onApprove={handleManualApprove}
        onReject={handleManualReject}
        isProcessing={isVerifying}
        successState={consentSuccess}
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