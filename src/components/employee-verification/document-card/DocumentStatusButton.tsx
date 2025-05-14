
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VerificationDocument } from '@/types/employeeVerification';
import { ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import AadharDetailsDialog from '../documents-list/AadharDetailsDialog';

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
      if (document.document_status_id) {
        const statuses = await fetchDocumentStatuses();
        const status = statuses.find(s => s.id === document.document_status_id);
        setStatusName(status?.name || null);
      }
    };
    
    getStatusName();
  }, [document.document_status_id, fetchDocumentStatuses]);

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

  let buttonContent, buttonStyle;

  // Define button appearance based on verification status and document status
  if (document.verificationStatus === 'verified') {
    // If the document is verified and has a governance status
    if (statusName === 'Governance') {
      buttonContent = (
        <>
          <ShieldCheck className="h-4 w-4 mr-2" />
          <span>Verified / Governance</span>
        </>
      );
      buttonStyle = "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:text-green-800";
    } else {
      buttonContent = (
        <>
          <ShieldCheck className="h-4 w-4 mr-2" />
          <span>Verified</span>
        </>
      );
      buttonStyle = "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:text-green-800";
    }
  } else if (document.verificationStatus === 'failed') {
    buttonContent = (
      <>
        <AlertCircle className="h-4 w-4 mr-2" />
        <span>Failed Verification</span>
      </>
    );
    buttonStyle = "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:text-red-800";
  } else {
    buttonContent = (
      <>
        <Clock className="h-4 w-4 mr-2" />
        <span>Pending Verification</span>
      </>
    );
    buttonStyle = "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200 hover:text-yellow-800";
  }

  const handleClick = () => {
    // Only open dialog if we have governance verification data
    if (document.verificationStatus === 'verified' && 
        statusName === 'Governance' && 
        aadharDetails) {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className={`text-xs ${buttonStyle} ${(document.verificationStatus === 'verified' && statusName === 'Governance' && aadharDetails) ? 'cursor-pointer' : 'cursor-default'}`}
        size="sm"
        onClick={handleClick}
      >
        {buttonContent}
      </Button>

      <AadharDetailsDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        aadharDetails={aadharDetails}
      />
    </>
  );
};

export default DocumentStatusButton;
