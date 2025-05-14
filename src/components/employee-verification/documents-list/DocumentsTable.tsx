
import React, { useEffect } from 'react';
import { Eye, Download, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VerificationDocument } from '@/types/employeeVerification';
import DocumentDeleteButton from '../document-card/DocumentDeleteButton';
import VerificationStatusBadge from '../VerificationStatusBadge';
import { getDocumentIcon, formatDocumentTypeName } from '../utils/documentUtils';
import { useEmployeeVerification } from '@/contexts/employee-verification';

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
  const { documentStatuses } = useEmployeeVerification();
  
  // Log document statuses when component mounts or documents change
  useEffect(() => {
    console.log('Documents status information:', documents.map(doc => ({
      id: doc.id,
      status: doc.verificationStatus,
      statusId: doc.documentStatusId,
      hasLogs: !!doc.employee_docs_log && doc.employee_docs_log.length > 0
    })));
    
    console.log('Available document statuses:', documentStatuses);
  }, [documents, documentStatuses]);
  
  const getDocumentStatusName = (document: VerificationDocument): string | undefined => {
    if (!document.documentStatusId || document.verificationStatus !== 'verified') return undefined;
    
    const status = documentStatuses.find(s => s.id === document.documentStatusId);
    const statusName = status?.name;
    
    console.log('Document status lookup:', {
      documentId: document.id,
      statusId: document.documentStatusId,
      foundStatus: !!status,
      statusName
    });
    
    return statusName;
  };
  
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Document #</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => {
            const statusName = getDocumentStatusName(doc);
            return (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getDocumentIcon(doc.documentTypeName || '')}
                    <span className="capitalize">{formatDocumentTypeName(doc.documentTypeName || '')}</span>
                  </div>
                </TableCell>
                <TableCell>{doc.documentNumber || '—'}</TableCell>
                <TableCell>
                  {doc.createdAt ? formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true }) : '—'}
                </TableCell>
                <TableCell>
                  <VerificationStatusBadge 
                    status={doc.verificationStatus} 
                    documentStatusName={statusName}
                  />
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentsTable;
