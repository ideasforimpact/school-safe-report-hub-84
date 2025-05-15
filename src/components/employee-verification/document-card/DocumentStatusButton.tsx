import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VerificationDocument } from '@/types/employeeVerification';
import { ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import AadharDetailsDialog from '../documents-list/AadharDetailsDialog';
import VerificationStatusBadge from '../VerificationStatusBadge';
import { useToast } from '@/hooks/use-toast';

interface DocumentStatusButtonProps {
  document: VerificationDocument;
}

const DocumentStatusButton: React.FC<DocumentStatusButtonProps> = ({ document }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aadharDetails, setAadharDetails] = useState<any>(null);
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
      const verificationLog = document.employee_docs_log
        .filter(log => log.action === 'verify_aadhar_otp' && log.response?.success === true)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (verificationLog) {
        setAadharDetails(verificationLog);
      }
    }
  }, [document]);

  const handleClick = () => {
    // Only open dialog if we have verification data
    if (document.verificationStatus === 'verified' && 
        statusName === 'governance' && 
        document.documentTypeName?.toLowerCase().includes('aadhar') &&
        document.employee_docs_log && 
        document.employee_docs_log.length > 0) {
      setDialogOpen(true);
      toast({
        title: "Viewing Aadhar verification details",
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
  const isAadhar = document.documentTypeName?.toLowerCase().includes('aadhar');

  return (
    <>
      <VerificationStatusBadge 
        status={document.verificationStatus} 
        isGovernance={isGovernanceVerified}
        documentStatusName={document.verificationStatus === 'verified' && statusName ? statusName : undefined}
        onClick={isAadhar && isGovernanceVerified && hasLogs ? handleClick : undefined}
        documentLogs={document.employee_docs_log}
        documentId={document.id}
      />

      {/* Keep Aadhar dialog for backward compatibility */}
      <AadharDetailsDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        aadharDetails={aadharDetails || document.employee_docs_log?.[0]}
      />
    </>
  );
};

export default DocumentStatusButton;
