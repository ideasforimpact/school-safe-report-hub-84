
import React, { useState } from 'react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { VerificationDocument } from '@/types/employeeVerification';
import { useToast } from '@/hooks/use-toast';
import { formatSupabaseUrl, isPdfFile } from '@/types/fileTypes';
import DocumentsTable from './DocumentsTable';
import EmptyDocumentsState from './EmptyDocumentsState';
import VerificationDialog from './VerificationDialog';

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
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);

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
    setIsVerificationDialogOpen(true);
  };

  const handleVerificationSubmit = async (method: 'api' | 'manual') => {
    if (selectedDocumentId) {
      await verifyDocument(selectedDocumentId, 'verified', method);
      setIsVerificationDialogOpen(false);
      setSelectedDocumentId('');
      
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
      
      // Trigger document refetch after rejection
      if (onDocumentAction) {
        onDocumentAction();
      }
    }
  };

  const handleDialogClose = () => {
    setIsVerificationDialogOpen(false);
    setSelectedDocumentId('');
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
      />
    </>
  );
};

export default DocumentsList;
