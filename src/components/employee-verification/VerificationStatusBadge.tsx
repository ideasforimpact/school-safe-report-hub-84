
import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerificationStatusBadgeProps {
  status: 'pending' | 'verified' | 'failed' | boolean;
  documentStatusName?: string;
  documentLogs?: Array<{
    timestamp: string;
    action: string;
    response: any;
  }>;
  documentId?: string;
  documentType?: string;
  className?: string;
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ 
  status,
  documentStatusName, 
  documentLogs,
  className,
  documentId,
  documentType
}) => {
  // Convert boolean status (from employee) to verification status string
  const displayStatus = typeof status === 'boolean' 
    ? (status ? 'verified' : 'failed') 
    : status;

  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let text = 'Unknown';
  
  switch (displayStatus) {
    case 'verified':
      variant = 'default';
      text = documentStatusName || 'Verified';
      break;
    case 'pending':
      variant = 'secondary';
      text = 'Pending';
      break;
    case 'failed':
      variant = 'destructive';
      text = documentStatusName || 'Failed';
      break;
    default:
      variant = 'outline';
      text = 'Unknown';
  }
  
  const hasLogs = documentLogs && documentLogs.length > 0;
  
  if (!hasLogs) {
    return (
      <Badge 
        variant={variant} 
        className={cn(
          "px-2 py-1 text-xs font-medium rounded", 
          displayStatus === 'pending' && "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
          displayStatus === 'failed' && "bg-red-100 text-red-800 hover:bg-red-200",
          displayStatus === 'verified' && "bg-green-100 text-green-800 hover:bg-green-200",
          className
        )}
      >
        {text}
      </Badge>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={variant} 
            className={cn(
              "px-2 py-1 text-xs font-medium rounded cursor-help", 
              displayStatus === 'pending' && "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
              displayStatus === 'failed' && "bg-red-100 text-red-800 hover:bg-red-200",
              displayStatus === 'verified' && "bg-green-100 text-green-800 hover:bg-green-200",
              className
            )}
          >
            {text}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="w-80 p-0">
          <div className="p-2">
            <h4 className="font-bold mb-1">Verification History</h4>
            {documentLogs?.map((log, index) => (
              <div key={index} className="text-xs mb-2 pb-2 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0">
                <div className="flex justify-between text-gray-500">
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                  <span>{log.action}</span>
                </div>
                {log.response && typeof log.response === 'object' && (
                  <div className="mt-1 text-gray-700">
                    {Object.entries(log.response).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span>{' '}
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerificationStatusBadge;
