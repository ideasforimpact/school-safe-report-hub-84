
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
import { getDocumentIcon } from '../utils/documentUtils';

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
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Document #</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getDocumentIcon(doc.documentType)}
                  <span className="capitalize">{doc.documentType.replace('_', ' ')}</span>
                </div>
              </TableCell>
              <TableCell>{doc.documentNumber || '—'}</TableCell>
              <TableCell>
                <img 
                  src={doc.documentImage} 
                  alt="Document preview" 
                  className="h-12 w-16 object-cover rounded border border-gray-200 cursor-pointer"
                  onClick={() => onViewDocument(doc.documentImage)}
                />
              </TableCell>
              <TableCell>
                {doc.createdAt ? formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true }) : '—'}
              </TableCell>
              <TableCell>
                <VerificationStatusBadge status={doc.verificationStatus} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center space-x-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onViewDocument(doc.documentImage)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDownloadDocument(doc.documentImage)}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                  {doc.verificationStatus === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      onClick={() => onVerifyDocument(doc.id)}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                  )}
                  <DocumentDeleteButton documentId={doc.id} />
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
