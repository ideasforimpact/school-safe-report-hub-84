
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VerificationDocument } from '@/types/employeeVerification';
import DocumentActions from '../document-card/DocumentActions';
import DocumentStatusButton from '../document-card/DocumentStatusButton';

interface DocumentsTableProps {
  documents: VerificationDocument[];
  onVerify?: (documentId: string, status: 'verified' | 'failed', method?: 'api' | 'manual', notes?: string) => void;
  onDelete?: (documentId: string) => void;
  onViewDocument?: (documentImage: string) => void;
  onDownloadDocument?: (documentImage: string) => void;
  onVerifyDocument?: (documentId: string) => void;
  onDocumentAction?: () => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  onVerify,
  onDelete,
  onViewDocument,
  onDownloadDocument,
  onVerifyDocument,
  onDocumentAction
}) => {
  const handleVerify = (document: VerificationDocument) => {
    return (status: 'verified' | 'failed', method?: 'api' | 'manual', notes?: string) => {
      onVerify?.(document.id, status, method, notes);
    };
  };

  const handleDelete = (documentId: string) => {
    return () => {
      onDelete?.(documentId);
    };
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Type</TableHead>
            <TableHead>Document Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">
                {document.documentTypeName}
              </TableCell>
              <TableCell>
                {document.documentNumber || 'Not provided'}
              </TableCell>
              <TableCell>
                <DocumentStatusButton document={document} />
              </TableCell>
              <TableCell>
                {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'Unknown'}
              </TableCell>
              <TableCell>
                <DocumentActions
                  document={document}
                  onVerify={handleVerify(document)}
                  onDelete={handleDelete(document.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentsTable;
