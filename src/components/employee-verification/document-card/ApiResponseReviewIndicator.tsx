import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Eye, FileCheck } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';
import AadharDetailsDialog from '../documents-list/AadharDetailsDialog';
import PanDetailsDialog from './PanDetailsDialog';
import VoterIdDetailsDialog from './VoterIdDetailsDialog';
import DrivingLicenseDetailsDialog from './DrivingLicenseDetailsDialog';
import BankStatementDetailsDialog from './BankStatementDetailsDialog';

interface ApiResponseReviewIndicatorProps {
  document: VerificationDocument;
  onVerificationUpdate?: () => void;
}

const ApiResponseReviewIndicator: React.FC<ApiResponseReviewIndicatorProps> = ({ 
  document, 
  onVerificationUpdate 
}) => {
  const [aadharDialogOpen, setAadharDialogOpen] = useState(false);
  const [panDialogOpen, setPanDialogOpen] = useState(false);
  const [voterIdDialogOpen, setVoterIdDialogOpen] = useState(false);
  const [drivingLicenseDialogOpen, setDrivingLicenseDialogOpen] = useState(false);
  const [bankStatementDialogOpen, setBankStatementDialogOpen] = useState(false);

  // Only show if document has API response data and is still pending
  if (!document.apiResponseData || document.verificationStatus !== 'pending') {
    return null;
  }

  const openDetailDialog = () => {
    const docType = document.documentTypeName?.toLowerCase();
    
    if (docType?.includes('aadhar')) {
      setAadharDialogOpen(true);
    } else if (docType === 'pan') {
      setPanDialogOpen(true);
    } else if (docType === 'voter_id') {
      setVoterIdDialogOpen(true);
    } else if (docType?.includes('driving') || docType?.includes('license')) {
      setDrivingLicenseDialogOpen(true);
    } else if (docType === 'bank account' || docType?.includes('bank')) {
      setBankStatementDialogOpen(true);
    }
  };

  // Extract relevant details from API response for each document type
  const getApiDetails = () => {
    const docType = document.documentTypeName?.toLowerCase();
    
    if (docType?.includes('aadhar')) {
      // For Aadhar, look for successful verification log
      const verificationLog = document.employee_docs_log
        ?.filter(log => log.action === 'verify_aadhar_otp' && log.response?.success === true)
        ?.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      return verificationLog || { response: document.apiResponseData };
    } else if (docType === 'pan') {
      // For PAN, look for PAN verification log
      const panLog = document.employee_docs_log?.find(log => 
        log.action === 'verify_pan_api' && 
        log.response?.success === true && 
        log.response?.status_code === 200
      );
      
      return panLog?.response || document.apiResponseData;
    } else if (docType === 'voter_id') {
      // For Voter ID, look for voter verification log
      const voterLog = document.employee_docs_log?.find(log => 
        log.action === 'verify_voter_id_api' && 
        log.response?.success === true && 
        log.response?.status_code === 200
      );
      
      return voterLog?.response || document.apiResponseData;
    } else if (docType?.includes('driving') || docType?.includes('license')) {
      // For Driving License, look for driving license verification log
      const drivingLog = document.employee_docs_log?.find(log => 
        (log.action?.includes('driving') || log.action?.includes('license')) && 
        log.response
      );
      
      return drivingLog?.response || document.apiResponseData;
    } else if (docType === 'bank account' || docType?.includes('bank')) {
      // For Bank Account, look for bank verification log
      const bankLog = document.employee_docs_log?.find(log => 
        log.action === 'bank_verification' && 
        log.response?.success === true && 
        log.response?.status_code === 200
      );
      
      return bankLog?.response || document.apiResponseData;
    }
    
    return document.apiResponseData;
  };

  const apiDetails = getApiDetails();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openDetailDialog}
        title="Review API Response"
        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
      >
        <FileCheck className="h-4 w-4" />
        <span className="sr-only">Review API Response</span>
      </Button>

      {/* Aadhar Details Dialog */}
      <AadharDetailsDialog
        open={aadharDialogOpen}
        onOpenChange={setAadharDialogOpen}
        aadharDetails={apiDetails}
        documentId={document.id}
        onVerificationUpdate={onVerificationUpdate}
      />

      {/* PAN Details Dialog */}
      <PanDetailsDialog
        open={panDialogOpen}
        onOpenChange={setPanDialogOpen}
        panDetails={apiDetails}
        documentId={document.id}
        onVerificationUpdate={onVerificationUpdate}
      />

      {/* Voter ID Details Dialog */}
      <VoterIdDetailsDialog
        open={voterIdDialogOpen}
        onOpenChange={setVoterIdDialogOpen}
        voterIdDetails={apiDetails}
        documentId={document.id}
        onVerificationUpdate={onVerificationUpdate}
      />

      {/* Driving License Details Dialog */}
      <DrivingLicenseDetailsDialog
        open={drivingLicenseDialogOpen}
        onOpenChange={setDrivingLicenseDialogOpen}
        licenseDetails={apiDetails}
        documentId={document.id}
        onVerificationUpdate={onVerificationUpdate}
      />

      {/* Bank Statement Details Dialog */}
      <BankStatementDetailsDialog
        open={bankStatementDialogOpen}
        onOpenChange={setBankStatementDialogOpen}
        statementDetails={apiDetails}
        documentId={document.id}
        onVerificationUpdate={onVerificationUpdate}
      />
    </>
  );
};

export default ApiResponseReviewIndicator;