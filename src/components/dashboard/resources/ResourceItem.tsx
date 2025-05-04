
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ResourceItemProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

const ResourceItem: React.FC<ResourceItemProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  bgColor, 
  borderColor 
}) => {
  return (
    <div className={`p-3 md:p-4 ${bgColor} rounded-lg border ${borderColor}`}>
      <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
        <div className={`${bgColor.replace('50', '100')} h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center`}>
          <Icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${color}`} />
        </div>
        <h3 className="font-medium text-gray-900 text-sm md:text-base">{title}</h3>
      </div>
      <p className="text-xs md:text-sm text-gray-600">{description}</p>
    </div>
  );
};

export default ResourceItem;
