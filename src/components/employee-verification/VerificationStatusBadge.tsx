
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import PanDetailsDialog from './document-card/PanDetailsDialog';
import VoterIdDetailsDialog from './document-card/VoterIdDetailsDialog';
import DrivingLicenseDetailsDialog from './document-card/DrivingLicenseDetailsDialog';

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
  
  const isClickable = !!onClick || isPanWithGovernance || isVoterIdWithGovernance || isDrivingLicenseWithGovernance;
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (isPanWithGovernance || isVoterIdWithGovernance || isDrivingLicenseWithGovernance) {
      setDialogOpen(true);
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
      {dialogOpen && panVerificationLog && documentType === 'pan' && (
        <PanDetailsDialog 
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          panDetails={panVerificationLog.response}
          documentId={documentId}
        />
      )}

      {/* Display Voter ID Details Dialog */}
      {dialogOpen && voterIdVerificationLog && documentType === 'voter_id' && (
        <VoterIdDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          voterIdDetails={voterIdVerificationLog.response}
          documentId={documentId}
        />
      )}

      {/* Display Driving License Details Dialog */}
      {dialogOpen && drivingLicenseVerificationLog && documentType === 'driving_license' && (
        <DrivingLicenseDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          licenseDetails={drivingLicenseVerificationLog.response}
          documentId={documentId}
        />
      )}
    </>
  );
};

export default VerificationStatusBadge;
