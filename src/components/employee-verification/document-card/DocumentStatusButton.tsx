
import React from 'react';
import {
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentStatusButtonProps {
  status: 'pending' | 'verified' | 'failed';
}

const DocumentStatusButton: React.FC<DocumentStatusButtonProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: Check,
          text: 'Verified',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          text: 'Failed',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: Clock,
          text: 'Pending',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200'
        };
    }
  };

  const { icon: Icon, text, bgColor, textColor, borderColor } = getStatusConfig();

  return (
    <div
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium',
        bgColor,
        textColor,
        borderColor
      )}
    >
      <Icon className="h-3 w-3 mr-1" />
      {text}
    </div>
  );
};

export default DocumentStatusButton;
