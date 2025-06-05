
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VehicleStatusBadgeProps {
  status: 'active' | 'maintenance' | 'inactive';
  className?: string;
}

const VehicleStatusBadge: React.FC<VehicleStatusBadgeProps> = ({ status, className }) => {
  const getVariant = () => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLabel = () => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Badge className={cn(getVariant(), className)} variant="outline">
      {getLabel()}
    </Badge>
  );
};

export default VehicleStatusBadge;
