
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VerificationDocument } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';

interface DocumentsTableProps {
  documents: VerificationDocument[];
  onRefresh: () => void;
  onViewDocument?: (documentImage: string) => void;
  onDownloadDocument?: (documentImage: string) => void;
  onVerifyDocument?: (documentId: string) => void;
  onDocumentAction?: () => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({ 
  documents, 
  onRefresh, 
  onViewDocument, 
  onDownloadDocument, 
  onVerifyDocument, 
  onDocumentAction 
}) => {
  const { deleteDocument } = useEmployeeVerification();
  const { toast } = useToast();

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      toast({
        title: "Document Deleted",
        description: "Document has been successfully deleted.",
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: 'pending' | 'verified' | 'failed' | 'in-progress' | 'completed' | 'rejected') => {
    const config = {
      verified: { color: 'bg-green-100 text-green-800', label: 'Verified' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      'in-progress': { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' }
    };

    const statusConfig = config[status] || config.pending;
    
    return (
      <Badge className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = (document: VerificationDocument) => {
    if (onDownloadDocument) {
      onDownloadDocument(document.documentImage);
    } else {
      // Fallback download implementation
      const link = window.document.createElement('a');
      link.href = document.documentImage;
      link.download = `${document.documentTypeName || 'document'}_${document.id.slice(0, 8)}.jpg`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleView = (document: VerificationDocument) => {
    if (onViewDocument) {
      onViewDocument(document.documentImage);
    } else {
      window.open(document.documentImage, '_blank');
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
        <p className="text-gray-500">No verification documents have been uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Type</TableHead>
            <TableHead>Document Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead>Verification Date</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  {document.documentTypeName || 'Unknown'}
                </div>
              </TableCell>
              <TableCell>
                {document.documentNumber || 'N/A'}
              </TableCell>
              <TableCell>
                {getStatusBadge(document.verificationStatus as 'pending' | 'verified' | 'failed' | 'in-progress' | 'completed' | 'rejected')}
              </TableCell>
              <TableCell>
                {formatDate(document.createdAt)}
              </TableCell>
              <TableCell>
                {document.verificationDate ? formatDate(document.verificationDate) : 'Not verified'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(document)}
                    className="h-8 w-8 p-0"
                    title="View document"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(document)}
                    className="h-8 w-8 p-0"
                    title="Download document"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(document.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentsTable;
