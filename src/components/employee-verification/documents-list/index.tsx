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

interface DocumentsListProps {
  employeeId: string;
  documents: VerificationDocument[];
  onAddDocument: () => void;
  initialLoadComplete: boolean;
  onDocumentAction?: () => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({
  employeeId,
  documents,
  onAddDocument,
  initialLoadComplete,
  onDocumentAction
}) => {
  const { verifyDocument, employees } = useEmployeeVerification();
  const { toast } = useToast();
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
    setSelectedDocumentId(documentId);
    if (method === 'manual') {
      setIsManualConsentOpen(true);
      setQuickStartMethod(null);
      return;
    }
    setQuickStartMethod(method);
    setIsVerificationDialogOpen(true);
  };

  const handleVerificationSubmit = async (method: 'api' | 'manual') => {
    if (selectedDocumentId) {
      await verifyDocument(selectedDocumentId, 'verified', method);
      setIsVerificationDialogOpen(false);
      setSelectedDocumentId('');
      setQuickStartMethod(null);
      
      // Trigger document refetch after verification
      if (onDocumentAction) {
        onDocumentAction();
      }
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
        return 'pan-verification';
    }
  };

  const handleManualApprove = async (): Promise<void> => {
    if (!selectedDocumentId) return;
    setIsProcessing(true);
    try {
      const functionName = getFunctionName(selectedDocument?.documentTypeName);
      const result = await supabase.functions.invoke(functionName, {
        body: {
          action: 'manualVerify',
          documentId: selectedDocumentId,
          verification_type: 'manual',
          verification_notes: 'Manually verified',
        },
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
    setIsProcessing(true);
    try {
      const functionName = getFunctionName(selectedDocument?.documentTypeName);
      const result = await supabase.functions.invoke(functionName, {
        body: {
          action: 'reject',
          documentId: selectedDocumentId,
          verification_type: 'manual',
          verification_notes: 'Document verification rejected by staff.',
        },
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
      <DocumentsTable
        documents={documents}
        onViewDocument={handleViewDocument}
        onDownloadDocument={handleDownloadDocument}
        onVerifyDocument={handleVerifyDocument}
        onDocumentAction={onDocumentAction}
        onQuickVerify={handleQuickVerify}
      />
      
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
