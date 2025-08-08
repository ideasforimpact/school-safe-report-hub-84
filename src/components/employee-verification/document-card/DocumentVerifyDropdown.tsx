
import React from 'react';
import { Button } from '@/components/ui/button';
import { Cpu, Wrench } from 'lucide-react';

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
          title={`API verification${documentTypeName ? ` for ${documentTypeName}` : ''}`}
          onClick={() => onVerify('api')}
        >
          <Cpu className="h-4 w-4" />
          <span>Verify API</span>
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
