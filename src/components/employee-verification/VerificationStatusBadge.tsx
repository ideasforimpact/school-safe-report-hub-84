
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileCheck } from 'lucide-react';

interface VerificationStatusBadgeProps {
  status: 'verified' | 'failed' | 'pending' | 'in-progress' | 'completed' | 'rejected';
  documentStatusName?: string;
  documentLogs?: Array<{
    timestamp: string;
    action: string;
    response: any;
    notes?: string;
  }>;
  documentId?: string;
  documentType?: string;
  className?: string;
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ 
  status, 
  documentStatusName,
  documentLogs,
  documentId,
  documentType,
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
      case 'completed':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3" />,
          label: 'Verified',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'failed':
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3" />,
          label: 'Failed',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'in-progress':
        return {
          variant: 'default' as const,
          icon: <Clock className="h-3 w-3" />,
          label: 'In Progress',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'pending':
      default:
        return {
          variant: 'secondary' as const,
          icon: <AlertTriangle className="h-3 w-3" />,
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge 
      variant={config.variant}
      className={`flex items-center gap-1 ${config.className} ${className || ''}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
};

export default VerificationStatusBadge;
