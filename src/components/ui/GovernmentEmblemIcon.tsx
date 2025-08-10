import React from 'react';

interface GovernmentEmblemIconProps {
  className?: string;
  size?: number;
}

const GovernmentEmblemIcon: React.FC<GovernmentEmblemIconProps> = ({ 
  className = "", 
  size = 20 
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* National Emblem of India Image */}
      <img 
        src="/transparent_gov.png" 
        alt="Government Emblem"
        width={size * 0.8}
        height={size * 0.8}
        className="flex-shrink-0 object-contain"
      />
      
      {/* Verify Text */}
      <span className="text-sm font-medium text-gray-600">Verify</span>
    </div>
  );
};

export default GovernmentEmblemIcon; 