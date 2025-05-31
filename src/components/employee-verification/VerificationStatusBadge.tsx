
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import PanDetailsDialog from './document-card/PanDetailsDialog';
import VoterIdDetailsDialog from './document-card/VoterIdDetailsDialog';
import DrivingLicenseDetailsDialog from './document-card/DrivingLicenseDetailsDialog';
import BankStatementDetailsDialog from './document-card/BankStatementDetailsDialog';

interface VerificationStatusBadgeProps {
  status: 'verified' | 'failed' | 'pending';
  className?: string;
  isGovernance?: boolean;
  documentStatusName?: string;
  onClick?: () => void;
  documentLogs?: Array<{
    timestamp: string;
    action: string;
    response: any;
    notes?: string;
  }>;
  documentId?: string;
  documentType?: string;
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ 
  status, 
  className, 
  isGovernance = false,
  documentStatusName,
  onClick,
  documentLogs,
  documentId,
  documentType
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [panDialogOpen, setPanDialogOpen] = useState(false);
  const [voterIdDialogOpen, setVoterIdDialogOpen] = useState(false);
  const [drivingLicenseDialogOpen, setDrivingLicenseDialogOpen] = useState(false);
  const [bankStatementDialogOpen, setBankStatementDialogOpen] = useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          text: documentStatusName ? `Verified/${documentStatusName}` : 'Verified',
          variant: 'success',
          bgColor: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          text: 'Failed',
          variant: 'destructive',
          bgColor: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'pending':
        return {
          icon: Clock,
          text: 'Pending',
          variant: 'default',
          bgColor: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      default:
        return {
          icon: Clock,
          text: 'Unknown',
          variant: 'default',
          bgColor: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const { icon: Icon, text, bgColor } = getStatusConfig();

  // Check if this document has details that can be shown in a dialog
  const isPanWithGovernance = documentType === 'pan' && 
                             status === 'verified' && 
                             documentStatusName === 'governance' && 
                             documentLogs && 
                             documentLogs.length > 0;
                             
  const isVoterIdWithGovernance = documentType === 'voter_id' && 
                                status === 'verified' && 
                                documentStatusName === 'governance' && 
                                documentLogs && 
                                documentLogs.length > 0;

  const isDrivingLicenseWithGovernance = documentType === 'driving_license' &&
                                      status === 'verified' &&
                                      documentStatusName === 'governance' &&
                                      documentLogs &&
                                      documentLogs.length > 0;
                                      
  const isBankStatementWithGovernance = documentType === 'bank_account' &&
                                     status === 'verified' &&
                                     documentStatusName === 'governance' &&
                                     documentLogs &&
                                     documentLogs.length > 0;
  
  //console.log('VerificationStatusBadge - Document Type:', documentType);
  //console.log('VerificationStatusBadge - Status:', status);
  //console.log('VerificationStatusBadge - Document Status Name:', documentStatusName);
  //console.log('VerificationStatusBadge - Has Logs:', documentLogs ? documentLogs.length > 0 : false);
  //console.log('VerificationStatusBadge - isDrivingLicenseWithGovernance:', isDrivingLicenseWithGovernance);
  //console.log('VerificationStatusBadge - isBankStatementWithGovernance:', isBankStatementWithGovernance);
  
  const isClickable = !!onClick || isPanWithGovernance || isVoterIdWithGovernance || 
                     isDrivingLicenseWithGovernance || isBankStatementWithGovernance;
  
  const handleClick = () => {
    //console.log('VerificationStatusBadge - Badge clicked!');
    //console.log('VerificationStatusBadge - onClick handler exists:', !!onClick);
    //console.log('VerificationStatusBadge - isPanWithGovernance:', isPanWithGovernance);
    //console.log('VerificationStatusBadge - isVoterIdWithGovernance:', isVoterIdWithGovernance);
    //console.log('VerificationStatusBadge - isDrivingLicenseWithGovernance:', isDrivingLicenseWithGovernance);
    //console.log('VerificationStatusBadge - isBankStatementWithGovernance:', isBankStatementWithGovernance);
    
    if (onClick) {
      //console.log('VerificationStatusBadge - Calling provided onClick handler');
      onClick();
    } else if (isPanWithGovernance) {
      //console.log('VerificationStatusBadge - Opening PAN dialog');
      setPanDialogOpen(true);
    } else if (isVoterIdWithGovernance) {
      //console.log('VerificationStatusBadge - Opening Voter ID dialog');
      setVoterIdDialogOpen(true);
    } else if (isDrivingLicenseWithGovernance) {
      //console.log('VerificationStatusBadge - Opening Driving License dialog');
      setDrivingLicenseDialogOpen(true);
    } else if (isBankStatementWithGovernance) {
      //console.log('VerificationStatusBadge - Opening Bank Statement dialog');
      setBankStatementDialogOpen(true);
    }
  };

  // Find PAN verification log if available
  const panVerificationLog = documentLogs?.find(log => 
    log.action === 'verify_pan_api' && 
    log.response?.success === true && 
    log.response?.status_code === 200
  );
  
  // Find Voter ID verification log if available
  const voterIdVerificationLog = documentLogs?.find(log => 
    log.action === 'verify_voter_id_api' && 
    log.response?.success === true && 
    log.response?.status_code === 200
  );

  // Find Driving License verification log if available
  const drivingLicenseVerificationLog = documentLogs?.find(log =>
    log.action === 'verify_driving_license_api' &&
    log.response?.success === true &&
    log.response?.status_code === 200
  );
  
  // Find Bank Statement verification log if available
  const bankStatementVerificationLog = documentLogs?.find(log =>
    (log.action === 'bank_statement_download_api' || log.action === 'bank_statement_upload_api') &&
    log.response?.success === true &&
    log.response?.status_code === 200
  );

  // If no specific log found, try to find any log with driving license data
  const fallbackDrivingLicenseLog = !drivingLicenseVerificationLog && documentType === 'driving_license' && documentLogs ? 
    documentLogs.find(log => 
      log.response?.data && 
      (log.action.includes('driving') || log.action.includes('license'))
    ) : null;
    
  // If no specific log found, try to find any log with bank statement data
  const fallbackBankStatementLog = !bankStatementVerificationLog && documentType === 'bank_account' && documentLogs ? 
    documentLogs.find(log => 
      log.response?.data && 
      (log.action.includes('bank') || log.action.includes('statement'))
    ) : null;
  
  // Log detailed information about found logs
  //console.log('VerificationStatusBadge - Found PAN verification log:', !!panVerificationLog);
  //console.log('VerificationStatusBadge - Found Voter ID verification log:', !!voterIdVerificationLog);
  //console.log('VerificationStatusBadge - Found Driving License verification log:', !!drivingLicenseVerificationLog);
  //console.log('VerificationStatusBadge - Found Bank Statement verification log:', !!bankStatementVerificationLog);
  //console.log('VerificationStatusBadge - Found fallback Driving License log:', !!fallbackDrivingLicenseLog);
  //console.log('VerificationStatusBadge - Found fallback Bank Statement log:', !!fallbackBankStatementLog);
  
  if (documentType === 'driving_license' && documentLogs) {
    //console.log('VerificationStatusBadge - All logs for driving license:', documentLogs);
  }
  
  if (documentType === 'bank_account' && documentLogs) {
    //console.log('VerificationStatusBadge - All logs for bank account:', documentLogs);
  }
  
  return (
    <>
      <Badge 
        className={cn(
          'gap-1 px-2 py-1 font-medium text-xs', 
          bgColor, 
          className,
          isClickable && 'cursor-pointer hover:opacity-80 transition-opacity hover:bg-opacity-80'
        )}
        onClick={isClickable ? handleClick : undefined}
      >
        <Icon className="h-3.5 w-3.5" />
        {text}
        {isClickable && (
          <span className="sr-only">{onClick ? "(click for action)" : "(click to view details)"}</span>
        )}
      </Badge>

      {/* Display PAN Details Dialog */}
      {panDialogOpen && panVerificationLog && documentType === 'pan' && (
        <PanDetailsDialog 
          open={panDialogOpen}
          onOpenChange={setPanDialogOpen}
          panDetails={panVerificationLog.response}
          documentId={documentId}
        />
      )}

      {/* Display Voter ID Details Dialog */}
      {voterIdDialogOpen && voterIdVerificationLog && documentType === 'voter_id' && (
        <VoterIdDetailsDialog
          open={voterIdDialogOpen}
          onOpenChange={setVoterIdDialogOpen}
          voterIdDetails={voterIdVerificationLog.response}
          documentId={documentId}
        />
      )}

      {/* Display Driving License Details Dialog */}
      {drivingLicenseDialogOpen && documentType === 'driving_license' && (
        <DrivingLicenseDetailsDialog
          open={drivingLicenseDialogOpen}
          onOpenChange={setDrivingLicenseDialogOpen}
          licenseDetails={(drivingLicenseVerificationLog || fallbackDrivingLicenseLog)?.response}
          documentId={documentId}
        />
      )}
      
      {/* Display Bank Statement Details Dialog */}
      {bankStatementDialogOpen && documentType === 'bank_account' && (
        <BankStatementDetailsDialog
          open={bankStatementDialogOpen}
          onOpenChange={setBankStatementDialogOpen}
          statementDetails={(bankStatementVerificationLog || fallbackBankStatementLog)?.response}
          documentId={documentId}
        />
      )}
    </>
  );
};

export default VerificationStatusBadge;
