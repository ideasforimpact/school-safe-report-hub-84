
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronDown } from 'lucide-react';

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm" disabled={isDisabled} className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-1" />
          Process Document
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onVerify('api')} className="cursor-pointer">
          API Verification
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onVerify('manual')} className="cursor-pointer">
          Manual Verification
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DocumentVerifyDropdown;
