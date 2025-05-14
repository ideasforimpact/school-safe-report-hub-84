
import React, { useState, useEffect } from 'react';
import { VerificationDocument } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import AadharDetailsDialog from '../documents-list/AadharDetailsDialog';
import VerificationStatusBadge from '../VerificationStatusBadge';
import { useToast } from '@/components/ui/use-toast';

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
    // For PAN verification, we store the complete API response directly in employee_docs_log
    if (document.documentTypeName?.toLowerCase() === 'pan' && 
        document.verificationStatus === 'verified' && 
        document.employee_docs_log) {
      
      // If employee_docs_log is the API response itself (not an array)
      if (document.employee_docs_log && typeof document.employee_docs_log === 'object' && document.employee_docs_log.success) {
        setVerificationDetails(document.employee_docs_log);
        return;
      }
    }
    
    // For Aadhar or other document types, check the log array
    if (document.employee_docs_log && Array.isArray(document.employee_docs_log)) {
      // Find the most recent successful verification log
      let verificationLog;
      
      if (document.documentTypeName?.toLowerCase() === 'aadhar') {
        verificationLog = document.employee_docs_log
          .filter(log => log.action === 'aadhar_verification_success')
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
        (document.employee_docs_log)) {
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
  const hasLogs = !!document.employee_docs_log;

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
