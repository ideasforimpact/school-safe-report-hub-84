
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationStatusBadgeProps {
  status: 'pending' | 'verified' | 'failed';
  documentStatusName?: string;
  className?: string;
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ 
  status, 
  documentStatusName,
  className
}) => {
  // Default display text based on status
  let displayText = documentStatusName || status.charAt(0).toUpperCase() + status.slice(1);
  
  switch (status) {
    case 'verified':
      return (
        <Badge className={cn("bg-green-100 text-green-800 border-green-200", className)}>
          <CheckCircle className="h-3 w-3 mr-1" />
          {displayText}
        </Badge>
      );
    case 'failed':
      return (
        <Badge className={cn("bg-red-100 text-red-800 border-red-200", className)}>
          <AlertCircle className="h-3 w-3 mr-1" />
          {displayText}
        </Badge>
      );
    case 'pending':
    default:
      return (
        <Badge variant="outline" className={cn(
          "bg-amber-50 text-amber-800 border-amber-200",
          "flex items-center",
          className
        )}>
          <Clock className="h-3 w-3 mr-1" />
          {displayText}
        </Badge>
      );
  }
};

export default VerificationStatusBadge;
