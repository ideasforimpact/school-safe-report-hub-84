
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Shield, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerificationDocument } from '@/types/employeeVerification';

interface VerificationStatusBadgeProps {
  status: 'verified' | 'failed' | 'pending';
  verificationMethod?: 'api' | 'manual';
  className?: string;
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ 
  status, 
  verificationMethod, 
  className 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        // Differentiate between manual and government verification
        if (verificationMethod === 'manual') {
          return {
            icon: Shield,
            text: 'Manual Verified',
            variant: 'success',
            bgColor: 'bg-purple-100 text-purple-800 border-purple-200'
          };
        } else if (verificationMethod === 'api') {
          return {
            icon: Building,
            text: 'Govt Verified',
            variant: 'success',
            bgColor: 'bg-blue-100 text-blue-800 border-blue-200'
          };
        } else {
          return {
            icon: CheckCircle,
            text: 'Verified',
            variant: 'success',
            bgColor: 'bg-green-100 text-green-800 border-green-200'
          };
        }
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

  return (
    <Badge className={cn('gap-1 px-2 py-1 font-medium text-xs', bgColor, className)}>
      <Icon className="h-3.5 w-3.5" />
      {text}
    </Badge>
  );
};

export default VerificationStatusBadge;
