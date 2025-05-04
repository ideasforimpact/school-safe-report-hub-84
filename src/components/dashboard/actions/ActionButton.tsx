
import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  title: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, icon: Icon, color, bgColor, onClick }) => {
  return (
    <Button 
      variant="outline" 
      className="h-auto py-4 md:py-6 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:text-primary-700 border-none shadow-card hover:shadow-card-hover"
      onClick={onClick}
    >
      <div className={`${bgColor} h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center`}>
        <Icon className={`h-4 w-4 md:h-5 md:w-5 ${color}`} />
      </div>
      <span className="text-xs md:text-sm text-center">{title}</span>
    </Button>
  );
};

export default ActionButton;
