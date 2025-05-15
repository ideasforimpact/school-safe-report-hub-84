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
import { useToast } from '@/hooks/use-toast';
import AadharDetailsDialog from './AadharDetailsDialog';
import PanDetailsDialog from '../document-card/PanDetailsDialog';
import VoterIdDetailsDialog from '../document-card/VoterIdDetailsDialog';
import DrivingLicenseDetailsDialog from '../document-card/DrivingLicenseDetailsDialog';

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
  const [panDialogOpen, setPanDialogOpen] = React.useState(false);
  const [voterIdDialogOpen, setVoterIdDialogOpen] = React.useState(false);
  const [selectedPanDetails, setSelectedPanDetails] = React.useState<any>(null);
  const [selectedVoterIdDetails, setSelectedVoterIdDetails] = React.useState<any>(null);
  const [selectedDocumentId, setSelectedDocumentId] = React.useState<string | undefined>(undefined);
  
  // Log documents for debugging
  console.log('DocumentsTable - All documents:', documents);
  
  useEffect(() => {
    console.log('DocumentsTable - Documents with driving license:', 
      documents.filter(doc => doc.documentTypeName?.toLowerCase().includes('driving')));
  }, [documents]);
  
  const getDocumentStatusName = (document: VerificationDocument): string | undefined => {
    if (!document.documentStatusId || document.verificationStatus !== 'verified' || documentStatuses.length === 0) {
      return undefined;
    }
    
    const status = documentStatuses.find(s => s.id === document.documentStatusId);
    return status?.name;
  };

  const handleBadgeClick = (doc: VerificationDocument) => {
    console.log('DocumentsTable - Badge clicked for document:', doc);
    console.log('DocumentsTable - Document type:', doc.documentTypeName);
    console.log('DocumentsTable - Verification status:', doc.verificationStatus);
    
    const statusName = getDocumentStatusName(doc);
    console.log('DocumentsTable - Document status name:', statusName);
    
    const hasLogs = !!doc.employee_docs_log && doc.employee_docs_log.length > 0;
    console.log('DocumentsTable - Has logs:', hasLogs);
    console.log('DocumentsTable - Number of logs:', doc.employee_docs_log?.length || 0);
    
    if (!hasLogs || !statusName || doc.verificationStatus !== 'verified') {
      console.log('DocumentsTable - Not showing dialog - Missing logs, status name, or not verified');
      return;
    }
    
    const docType = doc.documentTypeName?.toLowerCase();
    console.log('DocumentsTable - Document type (lowercase):', docType);
    setSelectedDocumentId(doc.id);
    
    if (docType?.includes('aadhar') && statusName === 'governance') {
      // Find the most recent successful verification log for Aadhar
      const verificationLog = doc.employee_docs_log
        .filter(log => log.action === 'verify_aadhar_otp' && log.response?.success === true)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      setSelectedDocumentDetails(verificationLog || doc.employee_docs_log[0]);
      setDialogOpen(true);
      toast({
        title: "Viewing Aadhar verification details",
        description: "Showing verification information for this document."
      });
    } 
    else if (docType === 'pan' && statusName === 'governance') {
      // Find PAN verification log
      const panVerificationLog = doc.employee_docs_log.find(log => 
        log.action === 'verify_pan_api' && 
        log.response?.success === true && 
        log.response?.status_code === 200
      );
      
      if (panVerificationLog) {
        setSelectedPanDetails(panVerificationLog.response);
        setPanDialogOpen(true);
        toast({
          title: "Viewing PAN verification details",
          description: "Showing verification information for this document."
        });
      }
    }
    else if (docType === 'voter_id' && statusName === 'governance') {
      // Find Voter ID verification log
      const voterIdVerificationLog = doc.employee_docs_log.find(log => 
        log.action === 'verify_voter_id_api' && 
        log.response?.success === true && 
        log.response?.status_code === 200
      );
      
      if (voterIdVerificationLog) {
        setSelectedVoterIdDetails(voterIdVerificationLog.response);
        setVoterIdDialogOpen(true);
        toast({
          title: "Viewing Voter ID verification details",
          description: "Showing verification information for this document."
        });
      }
    }
    else if (docType?.includes('driving') || docType?.includes('license')) {
      console.log('DocumentsTable - This is a driving license document');
      console.log('DocumentsTable - Document logs:', doc.employee_docs_log);
      
      // Attempt to find any log with driving license verification data
      const drivingLicenseLog = doc.employee_docs_log?.find(log => 
        (log.action?.includes('driving') || log.action?.includes('license')) && 
        log.response?.data
      );
      
      console.log('DocumentsTable - Found driving license log:', drivingLicenseLog);
      
      if (drivingLicenseLog && statusName === 'governance') {
        setSelectedDocumentDetails(drivingLicenseLog.response);
        setDialogOpen(true);
        
        toast({
          title: "Viewing Driving License verification details",
          description: "Showing verification information for this document."
        });
      }
    }
    else if (statusName) {
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
              const docType = doc.documentTypeName?.toLowerCase();
              const isClickable = isGovernanceVerified && hasLogs;
              
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
                      onClick={isClickable ? () => handleBadgeClick(doc) : undefined}
                      documentLogs={doc.employee_docs_log}
                      documentId={doc.id}
                      documentType={docType}
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

      {/* Dialogs for document verification details */}
      <AadharDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        aadharDetails={selectedDocumentDetails}
      />
      
      <PanDetailsDialog
        open={panDialogOpen}
        onOpenChange={setPanDialogOpen}
        panDetails={selectedPanDetails}
        documentId={selectedDocumentId}
      />
      
      <VoterIdDetailsDialog
        open={voterIdDialogOpen}
        onOpenChange={setVoterIdDialogOpen}
        voterIdDetails={selectedVoterIdDetails}
        documentId={selectedDocumentId}
      />
    </>
  );
};

export default DocumentsTable;
