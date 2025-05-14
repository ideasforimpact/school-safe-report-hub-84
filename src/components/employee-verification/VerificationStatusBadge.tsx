
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationStatusBadgeProps {
  status: 'pending' | 'verified' | 'failed';
  className?: string;
  documentStatusName?: string;
  isGovernance?: boolean;
  onClick?: () => void;
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ 
  status, 
  className = '',
  documentStatusName,
  isGovernance = false,
  onClick
}) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: 'Pending',
          variant: 'warning',
          bgColor: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'verified':
        return {
          icon: CheckCircle,
          text: isGovernance ? 'Verified - Governance' : 
                documentStatusName ? `Verified - ${documentStatusName}` : 'Verified',
          variant: 'success',
          bgColor: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          text: documentStatusName ? `Failed - ${documentStatusName}` : 'Failed',
          variant: 'destructive',
          bgColor: 'bg-red-100 text-red-800 border-red-200'
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
  
  const { icon: Icon, text, bgColor } = getStatusStyle();
  
  return (
    <Badge 
      variant="outline" 
      className={cn(`flex items-center gap-1 px-2 py-1 font-medium ${bgColor} cursor-${onClick ? 'pointer' : 'default'}`, className)}
      onClick={onClick}
    >
      <Icon className="h-3 w-3" />
      <span>{text}</span>
    </Badge>
  );
};

export default VerificationStatusBadge;
