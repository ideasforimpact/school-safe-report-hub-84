
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
  const { getEmployeeDocuments, verifyDocument, fetchEmployeeDocuments, isLoading } = useEmployeeVerification();
  const documents = getEmployeeDocuments(employeeId);
  const { toast } = useToast();
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
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
    
    loadDocuments();
  }, [employeeId, fetchEmployeeDocuments]);

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
    setSelectedDocument(documentId);
    setVerifyDialogOpen(true);
  };

  const handleVerify = async (method: 'api' | 'manual') => {
    if (!selectedDocument) return;
    
    setVerifying(true);
    
    try {
      // Simulate verification delay
      setTimeout(() => {
        const notes = method === 'api' 
          ? 'Document automatically verified successfully with government database.' 
          : 'Document manually verified successfully.';
        
        verifyDocument(
          selectedDocument,
          'verified',
          notes
        );
        
        toast({
          title: "Document Verified",
          description: `The document has been ${method === 'api' ? 'automatically' : 'manually'} verified successfully.`,
        });
        
        setVerifying(false);
        setVerifyDialogOpen(false);
      }, 1500); // Simulate API delay
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during verification.",
        variant: "destructive",
      });
      setVerifying(false);
    }
  };

  const rejectDocument = () => {
    if (!selectedDocument) return;
    
    setVerifying(true);
    
    try {
      // Simulate verification delay
      setTimeout(() => {
        verifyDocument(
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
      }, 1500); // Simulate API delay
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
      />
    </div>
  );
};

export default DocumentsList;
