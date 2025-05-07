
import React from 'react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Button } from '@/components/ui/button';
import { Upload, Eye, Download, Trash2 } from 'lucide-react';
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
import DocumentDeleteButton from './document-card/DocumentDeleteButton';
import VerificationStatusBadge from './VerificationStatusBadge';

interface DocumentsListProps {
  employeeId: string;
  onAddDocument?: () => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ employeeId, onAddDocument }) => {
  const { getEmployeeDocuments } = useEmployeeVerification();
  const documents = getEmployeeDocuments(employeeId);

  const formatDocumentType = (type: string) => {
    return capitalize(type.replace('_', ' '));
  };

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

  return (
    <div className="space-y-6">
      {documents.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <div className="max-w-md mx-auto">
            <Upload className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-6">Upload identification documents to verify this employee</p>
            {onAddDocument && (
              <Button onClick={onAddDocument} className="shadow-sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
        </div>
      ) : (
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
                        onClick={() => handleViewDocument(document.documentImage)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadDocument(document.documentImage)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                      <DocumentDeleteButton documentId={document.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default DocumentsList;
