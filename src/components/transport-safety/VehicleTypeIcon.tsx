
import React from 'react';
import { Bus, Car, Truck, CircleDot } from 'lucide-react';

interface VehicleTypeIconProps {
  type: string;
  className?: string;
  size?: number;
}

const VehicleTypeIcon: React.FC<VehicleTypeIconProps> = ({ 
  type, 
  className, 
  size = 24 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'bus':
        return <Bus size={size} className={className} />;
      case 'car':
        return <Car size={size} className={className} />;
      case 'truck':
        return <Truck size={size} className={className} />;
      case 'van':
        return <Car size={size} className={className} />;
      default:
        return <CircleDot size={size} className={className} />;
    }
  };

  return getIcon();
};

export default VehicleTypeIcon;
