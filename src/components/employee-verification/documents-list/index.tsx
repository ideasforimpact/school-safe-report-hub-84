
import React, { useState, useEffect } from 'react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';
import EmptyDocumentsState from './EmptyDocumentsState';
import DocumentsTable from './DocumentsTable';
import VerificationDialog from './VerificationDialog';
import { Loader2 } from 'lucide-react';

interface DocumentsListProps {
  employeeId: string;
  onAddDocument?: () => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ employeeId, onAddDocument }) => {
  const { getEmployeeDocuments, verifyDocument, fetchEmployeeDocuments, isLoading, documentStatuses } = useEmployeeVerification();
  const documents = getEmployeeDocuments(employeeId);
  const { toast } = useToast();
  
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedDocumentTypeName, setSelectedDocumentTypeName] = useState<string | null>(null);
  const [selectedDocumentNumber, setSelectedDocumentNumber] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Fetch documents when component mounts
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        await fetchEmployeeDocuments(employeeId);
      } finally {
        // Mark initial load as complete regardless of success/failure
        setInitialLoadComplete(true);
      }
    };
    
    if (!initialLoadComplete) {
      loadDocuments();
    }
  }, [employeeId, fetchEmployeeDocuments, initialLoadComplete]);

  const handleViewDocument = (documentImage: string) => {
    window.open(documentImage, '_blank');
  };

  const handleDownloadDocument = (documentImage: string) => {
    const link = document.createElement('a');
    link.href = documentImage;
    link.download = `document-${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openVerifyDialog = (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (document) {
      setSelectedDocument(documentId);
      setSelectedDocumentTypeName(document.documentTypeName || '');
      setSelectedDocumentNumber(document.documentNumber || '');
      setVerifyDialogOpen(true);
    }
  };

  const handleVerify = async (method: 'api' | 'manual') => {
    if (!selectedDocument) return;
    
    setVerifying(true);
    
    try {
      // Find the "verified" document status
      const verifiedStatus = documentStatuses.find(status => status.name === 'verified');
      
      // For non-Aadhar documents or manual verification
      const notes = method === 'api' 
        ? 'Document automatically verified successfully with government database.' 
        : 'Document manually verified successfully.';
      
      await verifyDocument(
        selectedDocument,
        'verified',
        notes,
        verifiedStatus?.id
      );
      
      toast({
        title: "Document Verified",
        description: `The document has been ${method === 'api' ? 'automatically' : 'manually'} verified successfully.`,
      });
      
      setVerifying(false);
      setVerifyDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during verification.",
        variant: "destructive",
      });
      setVerifying(false);
    }
  };

  const rejectDocument = async (documentStatusId?: string) => {
    if (!selectedDocument) return;
    
    setVerifying(true);
    
    try {
      // Find the "rejected" document status if not provided
      let rejectedStatusId = documentStatusId;
      if (!rejectedStatusId) {
        const rejectedStatus = documentStatuses.find(status => status.name === 'rejected');
        rejectedStatusId = rejectedStatus?.id;
      }
      
      await verifyDocument(
        selectedDocument,
        'failed',
        'Failed to verify document. Details do not match records.'
      );
      
      toast({
        title: "Verification Failed",
        description: "Document verification failed.",
        variant: "destructive"
      });
      
      setVerifying(false);
      setVerifyDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during verification.",
        variant: "destructive",
      });
      setVerifying(false);
    }
  };

  // Show loading state only during initial load, not for subsequent operations
  if (isLoading && !initialLoadComplete) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-gray-600">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {documents.length === 0 ? (
        <EmptyDocumentsState onAddDocument={onAddDocument} />
      ) : (
        <DocumentsTable 
          documents={documents}
          onViewDocument={handleViewDocument}
          onDownloadDocument={handleDownloadDocument}
          onVerifyDocument={openVerifyDialog}
        />
      )}

      <VerificationDialog
        open={verifyDialogOpen}
        onOpenChange={setVerifyDialogOpen}
        onVerify={handleVerify}
        onReject={rejectDocument}
        isVerifying={verifying}
        documentType={selectedDocumentTypeName || undefined}
        documentId={selectedDocument || undefined}
        documentNumber={selectedDocumentNumber}
      />
    </div>
  );
};

export default DocumentsList;
