
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VerificationDocument } from '@/types/employeeVerification';
import { ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import AadharDetailsDialog from '../documents-list/AadharDetailsDialog';
import VerificationStatusBadge from '../VerificationStatusBadge';
import { useToast } from '@/components/ui/use-toast';

interface DocumentStatusButtonProps {
  document: VerificationDocument;
}

const DocumentStatusButton: React.FC<DocumentStatusButtonProps> = ({ document }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aadharDetails, setAadharDetails] = useState<any>(null);
  const { fetchDocumentStatuses } = useEmployeeVerification();
  const [statusName, setStatusName] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const getStatusName = async () => {
      if (document.documentStatusId) {
        const statuses = await fetchDocumentStatuses();
        const status = statuses.find(s => s.id === document.documentStatusId);
        setStatusName(status?.name || null);
        console.log('Document status fetched:', { 
          documentId: document.id,
          statusId: document.documentStatusId, 
          statusName: status?.name,
        });
      }
    };
    
    getStatusName();
  }, [document.documentStatusId, fetchDocumentStatuses]);

  useEffect(() => {
    if (document.employee_docs_log && Array.isArray(document.employee_docs_log)) {
      // Find the most recent successful verification log
      const verificationLog = document.employee_docs_log
        .filter(log => log.action === 'verify_aadhar_otp' && log.response?.success === true)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (verificationLog) {
        setAadharDetails(verificationLog);
        console.log('Found Aadhar verification log:', { 
          documentId: document.id,
          hasVerificationLog: true,
          timestamp: verificationLog.timestamp
        });
      } else {
        console.log('No Aadhar verification log found:', {
          documentId: document.id,
          logsCount: document.employee_docs_log.length,
          logTypes: document.employee_docs_log.map(log => log.action)
        });
      }
    } else {
      console.log('No employee_docs_log available for document:', {
        documentId: document.id,
        verificationStatus: document.verificationStatus,
        hasLogs: !!document.employee_docs_log
      });
    }
  }, [document.employee_docs_log, document.id]);

  const handleClick = () => {
    // Only open dialog if we have governance verification data
    if (document.verificationStatus === 'verified' && 
        statusName === 'governance' && 
        aadharDetails) {
      console.log('Opening Aadhar details dialog:', {
        documentId: document.id,
        hasAadharDetails: !!aadharDetails
      });
      setDialogOpen(true);
      toast({
        title: "Viewing Aadhar verification details",
        description: "Showing verification information for this document."
      });
    } else {
      console.log('Cannot open dialog - missing requirements:', {
        documentId: document.id,
        isVerified: document.verificationStatus === 'verified',
        isGovernance: statusName === 'governance',
        hasAadharDetails: !!aadharDetails
      });
    }
  };
  
  const isGovernanceVerified = document.verificationStatus === 'verified' && statusName === 'governance';
  
  console.log('Document status evaluation:', {
    documentId: document.id,
    verificationStatus: document.verificationStatus,
    statusName,
    isGovernanceVerified,
    hasAadharDetails: !!aadharDetails,
    isClickable: isGovernanceVerified && !!aadharDetails
  });

  return (
    <>
      <VerificationStatusBadge 
        status={document.verificationStatus} 
        isGovernance={isGovernanceVerified}
        documentStatusName={document.verificationStatus === 'verified' && statusName ? statusName : undefined}
        onClick={isGovernanceVerified && aadharDetails ? handleClick : undefined}
      />

      <AadharDetailsDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        aadharDetails={aadharDetails}
      />
    </>
  );
};

export default DocumentStatusButton;
