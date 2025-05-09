
import React from 'react';
import { Eye, Download, ShieldCheck, Shield } from 'lucide-react';
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
            <TableHead>Verification Method</TableHead>
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
                {document.verificationStatus === 'verified' && document.verificationMethod ? (
                  <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                    document.verificationMethod === 'api' 
                      ? 'bg-blue-50 text-blue-800' 
                      : 'bg-purple-50 text-purple-800'
                  }`}>
                    {document.verificationMethod === 'api' ? (
                      <><ShieldCheck className="h-3.5 w-3.5 mr-1" /> API</>
                    ) : (
                      <><Shield className="h-3.5 w-3.5 mr-1" /> Manual</>
                    )}
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">-</span>
                )}
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
