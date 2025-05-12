
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { DocumentDeleteButton } from './DocumentDeleteButton';
import { DocumentStatusButton } from './DocumentStatusButton';
import { DocumentImagePreview } from './DocumentImagePreview';
import { DocumentActions } from './DocumentActions';
import { formatDistanceToNow } from 'date-fns';
import { VerificationDocument } from '@/types/employeeVerification';
import { getDocumentIcon } from '../utils/documentUtils';

interface DocumentsTableProps {
  documents: VerificationDocument[];
  onVerify: (id: string, status: 'verified' | 'failed') => void;
  onDelete: (id: string) => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({ 
  documents,
  onVerify,
  onDelete
}) => {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Document #</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getDocumentIcon(doc.documentType)}
                  <span className="capitalize">
                    {doc.documentType.replace('_', ' ')}
                  </span>
                </div>
              </TableCell>
              <TableCell>{doc.documentNumber || '—'}</TableCell>
              <TableCell>
                <DocumentImagePreview document={doc} />
              </TableCell>
              <TableCell>
                {doc.createdAt 
                  ? formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })
                  : '—'
                }
              </TableCell>
              <TableCell className="text-right">
                <DocumentActions 
                  document={doc}
                  onVerify={onVerify}
                  onDelete={onDelete}
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
