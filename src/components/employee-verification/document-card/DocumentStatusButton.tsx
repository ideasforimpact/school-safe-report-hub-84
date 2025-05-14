
import React, { useState, useEffect } from 'react';
import { VerificationDocument } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import AadharDetailsDialog from '../documents-list/AadharDetailsDialog';
import VerificationStatusBadge from '../VerificationStatusBadge';
import { useToast } from '@/hooks/use-toast';

interface DocumentStatusButtonProps {
  document: VerificationDocument;
}

const DocumentStatusButton: React.FC<DocumentStatusButtonProps> = ({ document }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const { documentStatuses } = useEmployeeVerification();
  const [statusName, setStatusName] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get status name from statusId
  useEffect(() => {
    if (document.documentStatusId && documentStatuses.length > 0) {
      const status = documentStatuses.find(s => s.id === document.documentStatusId);
      setStatusName(status?.name || null);
    }
  }, [document.documentStatusId, documentStatuses]);

  useEffect(() => {
    if (document.employee_docs_log && Array.isArray(document.employee_docs_log)) {
      // Find the most recent successful verification log
      let verificationLog;
      
      if (document.documentTypeName?.toLowerCase() === 'aadhar') {
        verificationLog = document.employee_docs_log
          .filter(log => log.action === 'verify_aadhar_otp' && log.response?.success === true)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      } else if (document.documentTypeName?.toLowerCase() === 'pan') {
        verificationLog = document.employee_docs_log
          .filter(log => log.action === 'pan_verification_success')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      }
      
      if (verificationLog) {
        setVerificationDetails(verificationLog);
      } else if (document.employee_docs_log.length > 0) {
        // If no specific verification log found, use the most recent log
        setVerificationDetails(document.employee_docs_log[document.employee_docs_log.length - 1]);
      }
    }
  }, [document]);

  const handleClick = () => {
    // Only open dialog if we have verification data
    if (document.verificationStatus === 'verified' && 
        statusName === 'governance' && 
        document.employee_docs_log && 
        document.employee_docs_log.length > 0) {
      setDialogOpen(true);
      
      let docType = document.documentTypeName?.toLowerCase() || '';
      toast({
        title: `Viewing ${docType} verification details`,
        description: "Showing verification information for this document."
      });
    } else if (document.verificationStatus === 'verified' && statusName) {
      toast({
        title: "Information",
        description: `This document is verified with status: ${statusName}`
      });
    }
  };
  
  const isGovernanceVerified = document.verificationStatus === 'verified' && statusName === 'governance';
  const hasLogs = !!document.employee_docs_log && document.employee_docs_log.length > 0;

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
        aadharDetails={verificationDetails}
      />
    </>
  );
};

export default DocumentStatusButton;
