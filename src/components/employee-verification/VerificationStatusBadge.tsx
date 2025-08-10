import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Clock, Play, X } from 'lucide-react';
import PanDetailsDialog from './document-card/PanDetailsDialog';
import VoterIdDetailsDialog from './document-card/VoterIdDetailsDialog';
import DrivingLicenseDetailsDialog from './document-card/DrivingLicenseDetailsDialog';
import BankStatementDetailsDialog from './document-card/BankStatementDetailsDialog';

interface VerificationStatusBadgeProps {
  status: 'verified' | 'failed' | 'pending' | 'in-progress' | 'completed' | 'rejected';
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
  rejectReason?: string;
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ 
  status, 
  className, 
  isGovernance = false,
  documentStatusName,
  onClick,
  documentLogs,
  documentId,
  documentType,
  rejectReason
}) => {
  const [panDialogOpen, setPanDialogOpen] = useState(false);
  const [voterIdDialogOpen, setVoterIdDialogOpen] = useState(false);
  const [drivingLicenseDialogOpen, setDrivingLicenseDialogOpen] = useState(false);
  const [bankStatementDialogOpen, setBankStatementDialogOpen] = useState(false);
  const [showCustomTooltip, setShowCustomTooltip] = useState(false);

  // Log reject reason for debugging
  console.log('VerificationStatusBadge - Status:', status);
  console.log('VerificationStatusBadge - Reject Reason:', rejectReason);
  console.log('VerificationStatusBadge - Reject Reason Type:', typeof rejectReason);
  console.log('VerificationStatusBadge - Reject Reason Length:', rejectReason?.length);
  console.log('VerificationStatusBadge - Should Show Tooltip:', status === 'failed' && rejectReason);

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          text: 'Verified',
          variant: 'success',
          bgColor: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          text: 'Completed',
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
      case 'rejected':
        return {
          icon: X,
          text: 'Rejected',
          variant: 'destructive',
          bgColor: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'in-progress':
        return {
          icon: Play,
          text: 'In Progress',
          variant: 'default',
          bgColor: 'bg-blue-100 text-blue-800 border-blue-200'
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
          text: 'Pending',
          variant: 'default',
          bgColor: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
    }
  };

  const { icon: Icon, text, bgColor } = getStatusConfig();

  // Check if this document has details that can be shown in a dialog
  const isGovernanceVerified = (status === 'verified' || status === 'completed') && documentStatusName === 'governance';
  const hasVerificationLogs = documentLogs && documentLogs.length > 0;
  
  // Determine if badge should be clickable
  const isClickable = isGovernanceVerified && hasVerificationLogs;
  
  // Define docType at component level so it can be accessed everywhere
  const docType = documentType?.toLowerCase();
  
  console.log('VerificationStatusBadge - Document Type:', documentType);
  console.log('VerificationStatusBadge - Status:', status);
  console.log('VerificationStatusBadge - Document Status Name:', documentStatusName);
  console.log('VerificationStatusBadge - Is Governance Verified:', isGovernanceVerified);
  console.log('VerificationStatusBadge - Has Verification Logs:', hasVerificationLogs);
  console.log('VerificationStatusBadge - Is Clickable:', isClickable);
  console.log('VerificationStatusBadge - Document Logs:', documentLogs);
  
  const handleClick = () => {
    console.log('VerificationStatusBadge - Badge clicked!');
    
    if (onClick) {
      console.log('VerificationStatusBadge - Calling provided onClick handler');
      onClick();
      return;
    }

    if (!isClickable) {
      console.log('VerificationStatusBadge - Not clickable, returning');
      return;
    }

    console.log('VerificationStatusBadge - Document type (lowercase):', docType);
    
    if (docType?.includes('aadhar')) {
      // For Aadhar, use the provided onClick if available
      if (onClick) {
        onClick();
      }
    } else if (docType === 'pan') {
      const panVerificationLog = documentLogs?.find(log => 
        log.action === 'verify_pan_api' && 
        log.response?.success === true && 
        log.response?.status_code === 200
      );
      
      if (panVerificationLog) {
        console.log('VerificationStatusBadge - Opening PAN dialog');
        setPanDialogOpen(true);
      }
    } else if (docType === 'voter_id') {
      const voterIdVerificationLog = documentLogs?.find(log => 
        log.action === 'verify_voter_id_api' && 
        log.response?.success === true && 
        log.response?.status_code === 200
      );
      
      if (voterIdVerificationLog) {
        console.log('VerificationStatusBadge - Opening Voter ID dialog');
        setVoterIdDialogOpen(true);
      }
    } else if (docType?.includes('driving') || docType?.includes('license')) {
      const drivingLicenseLog = documentLogs?.find(log => 
        log.action?.includes('driving') || log.action?.includes('license')
      );
      
      if (drivingLicenseLog) {
        console.log('VerificationStatusBadge - Opening Driving License dialog');
        setDrivingLicenseDialogOpen(true);
      }
    } else if (docType === 'bank account' || docType?.includes('bank')) {
      // Find the bank verification log specifically
      const bankVerificationLog = documentLogs?.find(log => 
        log.action === 'bank_verification' && 
        log.response?.success === true && 
        log.response?.status_code === 200
      );
      
      console.log('VerificationStatusBadge - Looking for bank verification log');
      console.log('VerificationStatusBadge - Available logs:', documentLogs?.map(log => log.action));
      console.log('VerificationStatusBadge - Found bank verification log:', bankVerificationLog);
      
      if (bankVerificationLog) {
        console.log('VerificationStatusBadge - Opening Bank Statement dialog with bank_verification log');
        setBankStatementDialogOpen(true);
      } else {
        console.log('VerificationStatusBadge - No bank_verification log found');
      }
    }
  };

  // Find verification logs for dialogs
  const panVerificationLog = documentLogs?.find(log => 
    log.action === 'verify_pan_api' && 
    log.response?.success === true && 
    log.response?.status_code === 200
  );
  
  const voterIdVerificationLog = documentLogs?.find(log => 
    log.action === 'verify_voter_id_api' && 
    log.response?.success === true && 
    log.response?.status_code === 200
  );

  const drivingLicenseVerificationLog = documentLogs?.find(log =>
    (log.action?.includes('driving') || log.action?.includes('license')) &&
    log.response
  );
  
  // Find the specific bank_verification log for the dialog
  const bankVerificationLog = documentLogs?.find(log =>
    log.action === 'bank_verification' &&
    log.response?.success === true &&
    log.response?.status_code === 200
  );
  
  return (
    <>
      <div className="relative">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Badge 
                className={cn(
                  'gap-1 px-2 py-1 font-medium text-xs', 
                  bgColor, 
                  className,
                  isClickable && 'cursor-pointer hover:opacity-80 transition-opacity hover:bg-opacity-80'
                )}
                onClick={isClickable ? handleClick : undefined}
                onMouseEnter={() => {
                  if (status === 'failed' && rejectReason) {
                    console.log('VerificationStatusBadge - Hovering over failed badge with reject reason:', rejectReason);
                    console.log('VerificationStatusBadge - Status:', status);
                    console.log('VerificationStatusBadge - RejectReason prop:', rejectReason);
                    // Show custom tooltip as fallback
                    setShowCustomTooltip(true);
                  }
                }}
                onMouseLeave={() => {
                  if (status === 'failed' && rejectReason) {
                    setShowCustomTooltip(false);
                  }
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {text}
                {isClickable && (
                  <span className="sr-only">(click to view details)</span>
                )}
              </Badge>
            </TooltipTrigger>
            {status === 'failed' && rejectReason && (
              <TooltipContent 
                side="top" 
                align="center"
                className="z-[99999] bg-red-100 border border-red-300 text-red-800 shadow-lg max-w-sm rounded-md"
                sideOffset={5}
              >
                <div className="p-2">
                  <p className="text-sm whitespace-nowrap">{rejectReason}</p>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Custom Tooltip Fallback */}
        {showCustomTooltip && status === 'failed' && rejectReason && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-[99999]">
            <div className="bg-red-100 border border-red-300 text-red-800 rounded-md shadow-lg p-2 max-w-sm">
              <p className="text-sm whitespace-nowrap">{rejectReason}</p>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-300"></div>
            </div>
          </div>
        )}
      </div>

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
      {drivingLicenseDialogOpen && drivingLicenseVerificationLog && documentType?.includes('driving') && (
        <DrivingLicenseDetailsDialog
          open={drivingLicenseDialogOpen}
          onOpenChange={setDrivingLicenseDialogOpen}
          licenseDetails={drivingLicenseVerificationLog.response}
          documentId={documentId}
        />
      )}
      
      {/* Display Bank Statement Details Dialog - Fixed condition */}
      {bankStatementDialogOpen && bankVerificationLog && (
        <BankStatementDetailsDialog
          open={bankStatementDialogOpen}
          onOpenChange={setBankStatementDialogOpen}
          statementDetails={bankVerificationLog.response}
          documentId={documentId}
        />
      )}
    </>
  );
};

export default VerificationStatusBadge;
