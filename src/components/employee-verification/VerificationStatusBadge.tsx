
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import PanDetailsDialog from './document-card/PanDetailsDialog';

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
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ 
  status, 
  className, 
  isGovernance = false,
  documentStatusName,
  onClick,
  documentLogs,
  documentId
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

  const isClickable = !!onClick || (status === 'verified' && documentStatusName === 'governance' && documentLogs && documentLogs.length > 0);
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (status === 'verified' && documentStatusName === 'governance' && documentLogs && documentLogs.length > 0) {
      setDialogOpen(true);
    }
  };

  // Find PAN verification log if available
  const panVerificationLog = documentLogs?.find(log => 
    log.action === 'verify_pan_api' && 
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
      {dialogOpen && panVerificationLog && (
        <PanDetailsDialog 
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          panDetails={panVerificationLog.response}
          documentId={documentId}
        />
      )}
    </>
  );
};

export default VerificationStatusBadge;
