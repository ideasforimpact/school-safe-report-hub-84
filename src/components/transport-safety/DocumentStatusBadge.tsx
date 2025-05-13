
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, CheckCircle2, HelpCircle } from 'lucide-react';

interface DocumentStatusBadgeProps {
  status: 'valid' | 'expired' | 'expiring_soon' | 'unverified';
  className?: string;
}

const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({ status, className }) => {
  const getVariantAndIcon = () => {
    switch (status) {
      case 'valid':
        return {
          variant: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle2 className="h-3 w-3 mr-1" />
        };
      case 'expired':
        return {
          variant: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="h-3 w-3 mr-1" />
        };
      case 'expiring_soon':
        return {
          variant: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-3 w-3 mr-1" />
        };
      case 'unverified':
        return {
          variant: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <HelpCircle className="h-3 w-3 mr-1" />
        };
      default:
        return {
          variant: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <HelpCircle className="h-3 w-3 mr-1" />
        };
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'valid':
        return 'Valid';
      case 'expired':
        return 'Expired';
      case 'expiring_soon':
        return 'Expiring Soon';
      case 'unverified':
        return 'Unverified';
      default:
        return 'Unknown';
    }
  };

  const { variant, icon } = getVariantAndIcon();

  return (
    <Badge className={cn(variant, 'flex items-center', className)} variant="outline">
      {icon}
      {getLabel()}
    </Badge>
  );
};

export default DocumentStatusBadge;
