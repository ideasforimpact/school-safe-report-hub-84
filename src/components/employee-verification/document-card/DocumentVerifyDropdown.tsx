
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import GovernmentEmblemIcon from '@/components/ui/GovernmentEmblemIcon';

interface DocumentVerifyDropdownProps {
  onVerify: (method: 'api' | 'manual') => void;
  documentTypeName?: string;
  isDisabled: boolean;
}

const DocumentVerifyDropdown: React.FC<DocumentVerifyDropdownProps> = ({ 
  onVerify,
  documentTypeName,
  isDisabled
}) => {
  return (
      <div className="flex items-center gap-2">
        <Button
          variant="verifyApi"
          disabled={isDisabled}
          title={`Government API verification${documentTypeName ? ` for ${documentTypeName}` : ''}`}
          onClick={() => onVerify('api')}
          className="border border-gray-300 hover:border-gray-400 bg-gray-50/90 hover:bg-gray-100/95 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
        >
          <GovernmentEmblemIcon size={18} />
        </Button>
        <Button
          variant="verifyManual"
          disabled={isDisabled}
          title={`Manual verification${documentTypeName ? ` for ${documentTypeName}` : ''}`}
          onClick={() => onVerify('manual')}
        >
          <Wrench className="h-4 w-4" />
          <span>Verify Manual</span>
        </Button>
      </div>
  );
};

export default DocumentVerifyDropdown;
