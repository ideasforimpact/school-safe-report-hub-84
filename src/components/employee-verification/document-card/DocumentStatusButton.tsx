
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VerificationDocument } from '@/types/employeeVerification';
import { ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import AadharDetailsDialog from '../documents-list/AadharDetailsDialog';
import VerificationStatusBadge from '../VerificationStatusBadge';

interface DocumentStatusButtonProps {
  document: VerificationDocument;
}

const DocumentStatusButton: React.FC<DocumentStatusButtonProps> = ({ document }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aadharDetails, setAadharDetails] = useState<any>(null);
  const { fetchDocumentStatuses } = useEmployeeVerification();
  const [statusName, setStatusName] = useState<string | null>(null);
  
  useEffect(() => {
    const getStatusName = async () => {
      if (document.documentStatusId) {
        const statuses = await fetchDocumentStatuses();
        const status = statuses.find(s => s.id === document.documentStatusId);
        setStatusName(status?.name || null);
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
      }
    }
  }, [document.employee_docs_log]);

  const handleClick = () => {
    // Only open dialog if we have governance verification data
    if (document.verificationStatus === 'verified' && 
        statusName === 'governance' && 
        aadharDetails) {
      setDialogOpen(true);
    }
  };
  
  const isGovernanceVerified = document.verificationStatus === 'verified' && statusName === 'governance';

  return (
    <>
      <VerificationStatusBadge 
        status={document.verificationStatus} 
        isGovernance={isGovernanceVerified}
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
