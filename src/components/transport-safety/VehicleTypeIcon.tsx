
import React from 'react';
import { Bus, Car, Truck, CircleDot, Bike, Tractor, User } from 'lucide-react';

interface VehicleTypeIconProps {
  type?: string; // Legacy: vehicle type string (bus, car, etc.)
  icon?: string | null; // New: icon name from vehicle_type table
  className?: string;
  size?: number;
}

const VehicleTypeIcon: React.FC<VehicleTypeIconProps> = ({ 
  type,
  icon,
  className, 
  size = 24 
}) => {
  const getIcon = () => {
    // Priority: Use icon prop if available (from database), otherwise fallback to type
    const iconName = icon || type;
    
    switch (iconName?.toLowerCase()) {
      case 'bus':
        return <Bus size={size} className={className} />;
      case 'car':
        return <Car size={size} className={className} />;
      case 'truck':
        return <Truck size={size} className={className} />;
      case 'van':
        return <Car size={size} className={className} />;
      case 'motorcycle':
      case 'two_wheeler':
        return <Bike size={size} className={className} />;
      case 'four_wheeler':
        return <Car size={size} className={className} />;
      case 'tractor':
        return <Tractor size={size} className={className} />;
      case 'walk_in':
        // Represent walk-in visitors with a colored person icon
        return <User size={size} className={`${className ?? ''} text-emerald-500`} />;
      case 'other':
      case 'others':
        return <CircleDot size={size} className={className} />;
      default:
        return <CircleDot size={size} className={className} />;
    }
  };

  return getIcon();
};

export default VehicleTypeIcon;
