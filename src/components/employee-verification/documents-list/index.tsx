
import React, { useState } from 'react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { VerificationDocument } from '@/types/employeeVerification';
import { useToast } from '@/hooks/use-toast';
import DocumentsTable from './DocumentsTable';
import EmptyDocumentsState from './EmptyDocumentsState';
import VerificationDialog from './VerificationDialog';

interface DocumentsListProps {
  employeeId: string;
  documents: VerificationDocument[];
  onAddDocument: () => void;
  initialLoadComplete: boolean;
}

const DocumentsList: React.FC<DocumentsListProps> = ({
  employeeId,
  documents,
  onAddDocument,
  initialLoadComplete
}) => {
  const { verifyDocument } = useEmployeeVerification();
  const { toast } = useToast();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);

  const handleViewDocument = (documentImage: string) => {
    if (documentImage) {
      window.open(documentImage, '_blank');
    } else {
      toast({
        title: "No Document",
        description: "No document image available to view.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = (documentImage: string) => {
    if (documentImage) {
      const link = document.createElement('a');
      link.href = documentImage;
      link.download = 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({
        title: "No Document",
        description: "No document available to download.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setIsVerificationDialogOpen(true);
  };

  const handleVerificationSubmit = async (status: 'verified' | 'failed', notes?: string) => {
    if (selectedDocumentId) {
      await verifyDocument(selectedDocumentId, status, 'manual', notes);
      setIsVerificationDialogOpen(false);
      setSelectedDocumentId('');
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

  return (
    <>
      <DocumentsTable
        documents={documents}
        onViewDocument={handleViewDocument}
        onDownloadDocument={handleDownloadDocument}
        onVerifyDocument={handleVerifyDocument}
      />
      
      <VerificationDialog
        open={isVerificationDialogOpen}
        onOpenChange={setIsVerificationDialogOpen}
        onSubmit={handleVerificationSubmit}
        documentId={selectedDocumentId}
      />
    </>
  );
};

export default DocumentsList;
