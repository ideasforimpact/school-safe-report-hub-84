
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Eye, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { VerificationDocument } from '@/types/employeeVerification';
import { getDocumentTypeLabel } from '../utils/documentUtils';
import VerificationStatusBadge from '../VerificationStatusBadge';

interface DocumentsTableProps {
  documents: VerificationDocument[];
  onViewDocument: (documentUrl: string) => void;
  onDownloadDocument: (documentUrl: string) => void;
  onVerifyDocument: (documentId: string) => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  onViewDocument,
  onDownloadDocument,
  onVerifyDocument,
}) => {
  // Sort documents by creation date (newest first)
  const sortedDocuments = [...documents].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Document Number</TableHead>
            <TableHead className="font-semibold">Date Uploaded</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDocuments.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">
                {getDocumentTypeLabel(document.documentTypeName || '')}
              </TableCell>
              <TableCell>
                {document.documentNumber || 'Not provided'}
              </TableCell>
              <TableCell>
                {formatDate(document.createdAt)}
              </TableCell>
              <TableCell>
                <VerificationStatusBadge 
                  status={document.verificationStatus} 
                  documentStatusName={document.documentStatusName}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onViewDocument(document.documentImage)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDownloadDocument(document.documentImage)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {document.verificationStatus === 'pending' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100" 
                      onClick={() => onVerifyDocument(document.id)}
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </Button>
                  )}
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
