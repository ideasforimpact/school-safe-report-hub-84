
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VehicleStatusBadgeProps {
  status: 'active' | 'maintenance' | 'inactive';
  isNewlyAdded?: boolean;
  className?: string;
}

const VehicleStatusBadge: React.FC<VehicleStatusBadgeProps> = ({ status, isNewlyAdded = false, className }) => {
  const getVariant = () => {
    // If newly added, always show grey regardless of status
    if (isNewlyAdded) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLabel = () => {
    // If newly added, show "Pending Verification" instead of the actual status
    if (isNewlyAdded) {
      return 'Pending Verification';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Badge className={cn(getVariant(), className)} variant="outline">
      {getLabel()}
    </Badge>
  );
};

export default VehicleStatusBadge;
