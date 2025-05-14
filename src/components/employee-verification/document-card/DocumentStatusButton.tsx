
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
  const { fetchDocumentStatuses, documentStatuses } = useEmployeeVerification();
  const [statusName, setStatusName] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch document statuses if needed
  useEffect(() => {
    const getStatuses = async () => {
      if (documentStatuses.length === 0) {
        await fetchDocumentStatuses();
      }
    };
    
    getStatuses();
  }, [fetchDocumentStatuses, documentStatuses]);
  
  // Get status name from statusId
  useEffect(() => {
    const getStatusName = () => {
      if (document.documentStatusId) {
        const status = documentStatuses.find(s => s.id === document.documentStatusId);
        setStatusName(status?.name || null);
        console.log('Document status fetched:', { 
          documentId: document.id,
          statusId: document.documentStatusId, 
          statusName: status?.name,
          allStatuses: documentStatuses.map(s => ({ id: s.id, name: s.name }))
        });
      }
    };
    
    getStatusName();
  }, [document.documentStatusId, documentStatuses]);

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
          logTypes: document.employee_docs_log.map(log => log.action),
          allLogs: document.employee_docs_log
        });
      }
    } else {
      console.log('No employee_docs_log available for document:', {
        documentId: document.id,
        verificationStatus: document.verificationStatus,
        hasLogs: !!document.employee_docs_log,
        documentLogValue: document.employee_docs_log
      });
    }
  }, [document]);

  const handleClick = () => {
    // Only open dialog if we have verification data
    if (document.verificationStatus === 'verified' && 
        statusName === 'governance' && 
        document.employee_docs_log && 
        document.employee_docs_log.length > 0) {
      console.log('Opening Aadhar details dialog:', {
        documentId: document.id,
        hasAadharDetails: !!aadharDetails,
        allLogs: document.employee_docs_log
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
        hasLogs: !!document.employee_docs_log && document.employee_docs_log.length > 0,
        statusName,
        allStatuses: documentStatuses.map(s => ({ id: s.id, name: s.name }))
      });
      
      if (document.verificationStatus === 'verified' && statusName) {
        toast({
          title: "Information",
          description: `This document is verified with status: ${statusName}`
        });
      }
    }
  };
  
  const isGovernanceVerified = document.verificationStatus === 'verified' && statusName === 'governance';
  const hasLogs = !!document.employee_docs_log && document.employee_docs_log.length > 0;
  
  console.log('Document status evaluation:', {
    documentId: document.id,
    verificationStatus: document.verificationStatus,
    statusName,
    isGovernanceVerified,
    hasAadharDetails: !!aadharDetails,
    hasLogs,
    isClickable: isGovernanceVerified && hasLogs
  });

  return (
    <>
      <VerificationStatusBadge 
        status={document.verificationStatus} 
        isGovernance={isGovernanceVerified}
        documentStatusName={document.verificationStatus === 'verified' && statusName ? statusName : undefined}
        onClick={(isGovernanceVerified && hasLogs) ? handleClick : undefined}
      />

      <AadharDetailsDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        aadharDetails={aadharDetails || document.employee_docs_log?.[0]}
      />
    </>
  );
};

export default DocumentStatusButton;
