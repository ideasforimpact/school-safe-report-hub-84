
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationStatusBadgeProps {
  status: 'verified' | 'failed' | 'pending';
  className?: string;
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ 
  status,
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          label: 'Verified',
          background: 'bg-green-100',
          text: 'text-green-800',
          hover: 'hover:bg-green-200'
        };
      case 'failed':
        return {
          icon: XCircle,
          label: 'Verification Failed',
          background: 'bg-red-100',
          text: 'text-red-800',
          hover: 'hover:bg-red-200'
        };
      default:
        return {
          icon: Clock,
          label: 'Pending Verification',
          background: 'bg-yellow-100',
          text: 'text-yellow-800',
          hover: 'hover:bg-yellow-200'
        };
    }
  };

  const { icon: Icon, label, background, text, hover } = getStatusConfig();

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 py-1 px-2 border-none", 
        background, 
        text,
        hover,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </Badge>
  );
};

export default VerificationStatusBadge;
