
import React from 'react';
import { Eye, Download, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { capitalize } from 'lodash';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VerificationDocument } from '@/types/employeeVerification';
import DocumentDeleteButton from '../document-card/DocumentDeleteButton';
import VerificationStatusBadge from '../VerificationStatusBadge';

interface DocumentsTableProps {
  documents: VerificationDocument[];
  onViewDocument: (documentImage: string) => void;
  onDownloadDocument: (documentImage: string) => void;
  onVerifyDocument: (documentId: string) => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  onViewDocument,
  onDownloadDocument,
  onVerifyDocument
}) => {
  const formatDocumentType = (type: string) => {
    return capitalize(type.replace('_', ' '));
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Type</TableHead>
            <TableHead>Document Number</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">{formatDocumentType(document.documentType)}</TableCell>
              <TableCell>{document.documentNumber || 'N/A'}</TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <VerificationStatusBadge status={document.verificationStatus} />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onViewDocument(document.documentImage)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDownloadDocument(document.documentImage)}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                  {document.verificationStatus === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      onClick={() => onVerifyDocument(document.id)}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Verify Now
                    </Button>
                  )}
                  <DocumentDeleteButton documentId={document.id} />
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
