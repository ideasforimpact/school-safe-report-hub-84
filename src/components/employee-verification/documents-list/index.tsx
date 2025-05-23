
import React, { useEffect } from 'react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import EmptyDocumentsState from './EmptyDocumentsState';
import DocumentsTable from './DocumentsTable';
import { Loader2 } from 'lucide-react';

interface DocumentsListProps {
  employeeId: string;
  onAddDocument?: () => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ 
  employeeId, 
  onAddDocument
}) => {
  const { getEmployeeDocuments, fetchEmployeeDocuments, isLoading, verifyDocument } = useEmployeeVerification();
  
  const documents = getEmployeeDocuments(employeeId);

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeDocuments(employeeId);
    }
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

  const handleVerifyDocument = async (documentId: string) => {
    try {
      await verifyDocument(documentId, 'verified', ''); // Added missing third parameter (notes)
    } catch (error) {
      console.error('Error verifying document:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return <EmptyDocumentsState onAddDocument={onAddDocument} />;
  }

  return (
    <DocumentsTable 
      documents={documents}
      onViewDocument={handleViewDocument}
      onDownloadDocument={handleDownloadDocument}
      onVerifyDocument={handleVerifyDocument}
    />
  );
};

export default DocumentsList;
