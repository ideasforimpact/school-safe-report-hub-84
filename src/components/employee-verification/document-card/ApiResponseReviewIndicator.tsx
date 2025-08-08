import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { VerificationDocument } from '@/types/employeeVerification';
import AadharDetailsDialog from '../documents-list/AadharDetailsDialog';
import PanDetailsDialog from './PanDetailsDialog';
import VoterIdDetailsDialog from './VoterIdDetailsDialog';
import DrivingLicenseDetailsDialog from './DrivingLicenseDetailsDialog';
import BankStatementDetailsDialog from './BankStatementDetailsDialog';
import { FileQuestion, FileSearch, ClipboardCheck } from 'lucide-react';

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

  // Determine badge content and variant
  const getBadgeContent = () => {
    if (!document.apiResponseData) {
      return {
        text: 'No details yet',
        variant: 'outline' as const,
        clickable: false,
        icon: FileQuestion,
        classes: 'bg-muted text-muted-foreground border-border',
      };
    }
    
    if (document.verificationStatus === 'pending') {
      return {
        text: 'Details available',
        variant: 'outline' as const,
        clickable: true,
        icon: FileSearch,
        classes: 'bg-accent/40 text-accent-foreground border-accent/50 hover:bg-accent/50',
      };
    }
    
    return {
      text: 'Details reviewed',
      variant: 'outline' as const,
      clickable: true,
      icon: ClipboardCheck,
      classes: 'bg-secondary/40 text-secondary-foreground border-secondary/50 hover:bg-secondary/50',
    };
  };

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
  const badgeContent = getBadgeContent();

  return (
    <>
      <Badge
        variant={badgeContent.variant}
        className={`${badgeContent.classes} ${badgeContent.clickable ? 'cursor-pointer' : ''}`}
        onClick={badgeContent.clickable ? openDetailDialog : undefined}
      >
        {badgeContent.icon
          ? React.createElement(badgeContent.icon, {
              className: 'mr-1.5 h-3.5 w-3.5',
              'aria-hidden': true,
            })
          : null}

        {badgeContent.text}
      </Badge>

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