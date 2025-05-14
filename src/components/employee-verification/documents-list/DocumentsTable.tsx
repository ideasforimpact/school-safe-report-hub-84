
import React from 'react';
import { VerificationDocument } from '@/types/employeeVerification';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Lock, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import DocumentStatusButton from '../document-card/DocumentStatusButton';
import DocumentDeleteButton from '../document-card/DocumentDeleteButton';

interface DocumentsTableProps {
  documents: VerificationDocument[];
  onView: (document: VerificationDocument) => void;
  onVerifyAadhar: (document: VerificationDocument) => void;
  onVerifyPan: (document: VerificationDocument) => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents, onView, onVerifyAadhar, onVerifyPan }) => {
  const renderVerificationButton = (document: VerificationDocument) => {
    if (document.verificationStatus !== 'pending') {
      return null;
    }

    if (document.documentTypeName === 'aadhar') {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={() => onVerifyAadhar(document)}
        >
          <Upload className="h-3 w-3 mr-1" />
          Verify
        </Button>
      );
    } else if (document.documentTypeName === 'pan') {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={() => onVerifyPan(document)}
        >
          <Upload className="h-3 w-3 mr-1" />
          Verify
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Type</TableHead>
            <TableHead>Document #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Uploaded</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  {document.documentTypeName?.toUpperCase() || 'Document'}
                  {document.documentStatusName?.toLowerCase() === 'governance' && (
                    <Badge variant="outline" className="ml-2 py-0 h-5 text-xs border-green-500 text-green-700 bg-green-50">
                      <Lock className="h-2.5 w-2.5 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {document.documentNumber ? 
                  `${document.documentNumber.substring(0, 2)}•••${document.documentNumber.substring(document.documentNumber.length - 2)}` : 
                  'N/A'}
              </TableCell>
              <TableCell>
                <DocumentStatusButton document={document} />
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onView(document)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                  
                  {renderVerificationButton(document)}
                  
                  <DocumentDeleteButton documentId={document.id} className="ml-2" />
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
