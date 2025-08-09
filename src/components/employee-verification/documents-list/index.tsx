import React, { useState } from 'react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { VerificationDocument } from '@/types/employeeVerification';
import { useToast } from '@/hooks/use-toast';
import { formatSupabaseUrl, isPdfFile } from '@/types/fileTypes';
import DocumentsTable from './DocumentsTable';
import EmptyDocumentsState from './EmptyDocumentsState';
import VerificationDialog from './VerificationDialog';
import { supabase } from '@/integrations/supabase/client';
import ManualConsentDialog from '../common/ManualConsentDialog';
import { useAuth } from '@/contexts/auth';
interface DocumentsListProps {
  employeeId: string;
  employeeName?: string;
  documents: VerificationDocument[];
  onAddDocument: () => void;
  initialLoadComplete: boolean;
  onDocumentAction?: () => void;
  isVerificationLoading?: boolean;
  setIsVerificationLoading?: (loading: boolean) => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({
  employeeId,
  employeeName,
  documents,
  onAddDocument,
  initialLoadComplete,
  onDocumentAction,
  isVerificationLoading = false,
  setIsVerificationLoading
}) => {
  const { verifyDocument, employees } = useEmployeeVerification();
  const { toast } = useToast();
  const { employeeData } = useAuth();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [quickStartMethod, setQuickStartMethod] = useState<'api' | 'manual' | null>(null);
  const [isManualConsentOpen, setIsManualConsentOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [consentSuccess, setConsentSuccess] = useState<null | 'verified' | 'rejected'>(null);
  const handleViewDocument = (documentImage: string) => {
    if (!documentImage) {
      toast({
        title: "No Document",
        description: "No document image available to view.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedUrl = formatSupabaseUrl(documentImage);
      console.log('Opening document URL for viewing:', formattedUrl);
      
      // Check if it's a PDF or image for proper viewing
      const isPdf = isPdfFile(formattedUrl);
      
      if (isPdf) {
        // For PDFs, open with PDF viewer controls
        const pdfViewerUrl = `${formattedUrl}#toolbar=1&navpanes=1&scrollbar=1`;
        window.open(pdfViewerUrl, '_blank', 'noopener,noreferrer');
      } else {
        // For images, open directly
        window.open(formattedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      toast({
        title: "Error",
        description: "Failed to open document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = (documentImage: string) => {
    if (!documentImage) {
      toast({
        title: "No Document",
        description: "No document available to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedUrl = formatSupabaseUrl(documentImage);
      console.log('Downloading document URL:', formattedUrl);
      
      const link = document.createElement('a');
      link.href = formattedUrl;
      link.download = `document-${new Date().getTime()}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Document download has been initiated.",
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setQuickStartMethod(null);
    setIsVerificationDialogOpen(true);
  };

  const handleQuickVerify = (documentId: string, method: 'api' | 'manual') => {
    // console.log('DocumentsList - handleQuickVerify called with:', { documentId, method });
    setSelectedDocumentId(documentId);
    // console.log('DocumentsList - selectedDocumentId set to:', documentId);
    if (method === 'manual') {
      setIsManualConsentOpen(true);
      setQuickStartMethod(null);
      return;
    }
    setQuickStartMethod(method);
    setIsVerificationDialogOpen(true);
  };

  const handleVerificationSubmit = async (method: 'api' | 'manual') => {
    if (!selectedDocumentId) return;

    const doc = documents.find(d => d.id === selectedDocumentId);
    const docType = doc?.documentTypeName?.toLowerCase();

    try {
      if (method === 'api' && (docType === 'bank_account' || docType === 'bank_statement')) {
        const functionName = getFunctionName(docType);
        await supabase.functions.invoke(functionName, {
          body: { action: 'apiVerify', documentId: selectedDocumentId },
        });
      } else {
        await verifyDocument(selectedDocumentId, 'verified', method);
      }

      setIsVerificationDialogOpen(false);
      setSelectedDocumentId('');
      setQuickStartMethod(null);
      onDocumentAction?.();
    } catch (error) {
      console.error('Verification submit error:', error);
      toast({ title: 'Verification Failed', description: 'Unable to complete verification.', variant: 'destructive' });
    }
  };

  const handleRejectDocument = async () => {
    if (selectedDocumentId) {
      await verifyDocument(selectedDocumentId, 'failed', 'manual');
      setIsVerificationDialogOpen(false);
      setSelectedDocumentId('');
      setQuickStartMethod(null);
      
      // Trigger document refetch after rejection
      if (onDocumentAction) {
        onDocumentAction();
      }
    }
  };

  const handleDialogClose = () => {
    setIsVerificationDialogOpen(false);
    setSelectedDocumentId('');
    setQuickStartMethod(null);
  };

  // Map document type to corresponding Edge Function name
  const getFunctionName = (documentTypeName?: string): string => {
    const typeName = documentTypeName?.toLowerCase();
    switch (typeName) {
      case 'bank_account':
      case 'bank_statement':
        return 'bank-statement';
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
        return 'pan-verification';
    }
  };
  const handleManualApprove = async (): Promise<void> => {
    if (!selectedDocumentId) return;
    const verifierId = employeeData?.id;
    const clientId = employeeData?.clientId || null;

    if (!verifierId) {
      toast({
        title: 'Cannot verify',
        description: 'Missing verifier identity. Please re-login and try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const functionName = getFunctionName(selectedDocument?.documentTypeName);
      const payload = {
        action: 'manualVerify' as const,
        documentId: selectedDocumentId,
        verification_type: 'manual' as const,
        verification_notes: 'Manually verified',
        verified_by_employee_id: verifierId,
        client_id: clientId,
        employee_id: (documents.find(d => d.id === selectedDocumentId)?.employeeId) || employeeId,
      };
      console.log('▶️ Manual Approve payload:', { functionName, payload });

      const result = await supabase.functions.invoke(functionName, {
        body: payload,
      });

      if (result.error) throw result.error;

      setConsentSuccess('verified');
      toast({ title: 'Document Verified', description: 'Document has been manually verified.' });
      onDocumentAction?.();

      setTimeout(() => {
        setIsManualConsentOpen(false);
        setConsentSuccess(null);
      }, 900);
    } catch (error: any) {
      console.error('Manual verification error:', error);
      toast({ title: 'Verification Failed', description: error.message || 'Failed to verify document.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualReject = async (): Promise<void> => {
    if (!selectedDocumentId) return;
    const verifierId = employeeData?.id;
    const clientId = employeeData?.clientId || null;

    if (!verifierId) {
      toast({
        title: 'Cannot reject',
        description: 'Missing verifier identity. Please re-login and try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const functionName = getFunctionName(selectedDocument?.documentTypeName);
      const payload = {
        action: 'reject' as const,
        documentId: selectedDocumentId,
        verification_type: 'manual' as const,
        verification_notes: 'Document verification rejected by staff.',
        verified_by_employee_id: verifierId,
        client_id: clientId,
        employee_id: (documents.find(d => d.id === selectedDocumentId)?.employeeId) || employeeId,
      };
      console.log('▶️ Manual Reject payload:', { functionName, payload });

      const result = await supabase.functions.invoke(functionName, {
        body: payload,
      });

      if (result.error) throw result.error;

      setConsentSuccess('rejected');
      toast({ title: 'Document Rejected', description: 'The document has been marked as failed.' });
      onDocumentAction?.();

      setTimeout(() => {
        setIsManualConsentOpen(false);
        setConsentSuccess(null);
      }, 900);
    } catch (error: any) {
      console.error('Rejection error:', error);
      toast({ title: 'Rejection Failed', description: error.message || 'Failed to reject document.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!initialLoadComplete) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return <EmptyDocumentsState onAddDocument={onAddDocument} />;
  }

  // Find the selected document to get its details
  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);

  return (
    <>
      <div className="relative">
        {isVerificationLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-gray-600 font-medium">Processing verification...</p>
            </div>
          </div>
        )}
        
        <DocumentsTable
          documents={documents}
          onViewDocument={handleViewDocument}
          onDownloadDocument={handleDownloadDocument}
          onVerifyDocument={handleVerifyDocument}
          onDocumentAction={onDocumentAction}
          onQuickVerify={handleQuickVerify}
        />
      </div>
      
      <VerificationDialog
        open={isVerificationDialogOpen}
        onOpenChange={handleDialogClose}
        onVerify={handleVerificationSubmit}
        onReject={handleRejectDocument}
        isVerifying={false}
        documentType={selectedDocument?.documentTypeName?.toLowerCase()}
        documentId={selectedDocumentId}
        documentNumber={selectedDocument?.documentNumber}
        quickStartMethod={quickStartMethod}
        documents={documents}
        onDocumentAction={onDocumentAction}
        setIsVerificationLoading={setIsVerificationLoading}
        employeeName={employeeName}
      />

      <ManualConsentDialog
        open={isManualConsentOpen}
        onOpenChange={(open) => {
          setIsManualConsentOpen(open);
          if (!open) setConsentSuccess(null);
        }}
        documentTypeName={selectedDocument?.documentTypeName}
        employeeName={(() => { const emp = employees?.find(e => e.id === (selectedDocument?.employeeId || employeeId)); return emp?.name || [emp?.firstName, emp?.lastName].filter(Boolean).join(' ') || 'Employee'; })()}
        onApprove={handleManualApprove}
        onReject={handleManualReject}
        isProcessing={isProcessing}
        successState={consentSuccess}
      />
    </>
  );
};

export default DocumentsList;
