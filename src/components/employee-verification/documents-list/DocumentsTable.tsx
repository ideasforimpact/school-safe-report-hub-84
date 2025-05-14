
import React from 'react';
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
import { useToast } from '@/hooks/use-toast';
import AadharDetailsDialog from './AadharDetailsDialog';

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
  const { toast } = useToast();
  const [selectedDocumentDetails, setSelectedDocumentDetails] = React.useState<any>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  
  const getDocumentStatusName = (document: VerificationDocument): string | undefined => {
    if (!document.documentStatusId || documentStatuses.length === 0) {
      return undefined;
    }
    
    const status = documentStatuses.find(s => s.id === document.documentStatusId);
    return status?.name;
  };

  const handleBadgeClick = (doc: VerificationDocument) => {
    const statusName = getDocumentStatusName(doc);
    const hasLogs = !!doc.employee_docs_log && doc.employee_docs_log.length > 0;
    
    if (doc.verificationStatus === 'verified' && statusName === 'governance' && hasLogs) {
      // Find the most recent successful verification log
      const verificationLog = doc.employee_docs_log
        .filter(log => log.action === 'verify_aadhar_otp' && log.response?.success === true)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      setSelectedDocumentDetails(verificationLog || doc.employee_docs_log[0]);
      setDialogOpen(true);
      toast({
        title: "Viewing Aadhar verification details",
        description: "Showing verification information for this document."
      });
    } else if (doc.verificationStatus === 'verified' && statusName) {
      toast({
        title: "Information",
        description: `This document is verified with status: ${statusName}`
      });
    }
  };
  
  return (
    <>
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
              const hasLogs = !!doc.employee_docs_log && doc.employee_docs_log.length > 0;
              const isGovernanceVerified = doc.verificationStatus === 'verified' && statusName === 'governance';
              
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
                      isGovernance={isGovernanceVerified}
                      onClick={isGovernanceVerified && hasLogs ? () => handleBadgeClick(doc) : undefined}
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

      {/* Common dialog for all document rows */}
      <AadharDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        aadharDetails={selectedDocumentDetails}
      />
    </>
  );
};

export default DocumentsTable;
