
import React, { useState } from 'react';
import DocumentsTable from './DocumentsTable';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VerificationDocument } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import EmptyDocumentsState from './EmptyDocumentsState';
import VerificationDialog from './VerificationDialog';
import { toast } from "sonner";

interface DocumentsListProps {
  employeeId: string;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ employeeId }) => {
  const { documents, verifyDocument, deleteDocument, fetchEmployeeDocuments } = useEmployeeVerification();
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VerificationDocument | null>(null);

  // Filter documents for this employee
  const employeeDocuments = documents.filter(doc => doc.employeeId === employeeId);

  const handleVerify = (documentId: string, status: 'verified' | 'failed') => {
    setSelectedDocument(documents.find(doc => doc.id === documentId) || null);
    setIsVerifyDialogOpen(true);
  };

  const handleConfirmVerify = async (notes?: string) => {
    if (!selectedDocument) return;
    
    try {
      const status = selectedDocument.verificationStatus === 'pending' ? 'verified' : 'failed';
      await verifyDocument(selectedDocument.id, status, notes);
      toast.success(`Document ${status === 'verified' ? 'verified' : 'marked as failed'} successfully`);
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Failed to update document status');
    } finally {
      setIsVerifyDialogOpen(false);
      setSelectedDocument(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleRefresh = () => {
    fetchEmployeeDocuments(employeeId);
    toast.info('Refreshing documents...');
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Documents</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            size="sm"
          >
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link to={`/employee-verification/${employeeId}/upload`}>
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Document
            </Link>
          </Button>
        </div>
      </div>

      {employeeDocuments.length === 0 ? (
        <EmptyDocumentsState employeeId={employeeId} />
      ) : (
        <DocumentsTable 
          documents={employeeDocuments}
          onVerify={handleVerify}
          onDelete={handleDelete}
        />
      )}

      <VerificationDialog 
        isOpen={isVerifyDialogOpen}
        onClose={() => setIsVerifyDialogOpen(false)}
        onConfirm={handleConfirmVerify}
        document={selectedDocument}
      />
    </div>
  );
};

export default DocumentsList;
