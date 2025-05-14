
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CheckCircle, Check, Upload } from 'lucide-react';

interface DocumentVerifyDropdownProps {
  onVerify: (method: 'api' | 'manual') => void;
  documentTypeName: string;
  isDisabled: boolean;
}

const DocumentVerifyDropdown: React.FC<DocumentVerifyDropdownProps> = ({ onVerify, documentTypeName, isDisabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Determine if API verification is available for this document type
  const hasApiVerification = ['aadhar', 'pan'].includes(documentTypeName.toLowerCase());

  // Handle verification method selection
  const handleVerificationMethod = (method: 'api' | 'manual') => {
    setIsOpen(false);
    onVerify(method);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-green-600 border-green-200 hover:bg-green-50"
          disabled={isDisabled}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Verify
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasApiVerification && (
          <DropdownMenuItem onClick={() => handleVerificationMethod('api')}>
            <Upload className="h-4 w-4 mr-2" />
            <span>API Verification</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleVerificationMethod('manual')}>
          <Check className="h-4 w-4 mr-2" />
          <span>Manual Verification</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DocumentVerifyDropdown;
