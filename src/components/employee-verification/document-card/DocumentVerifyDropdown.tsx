
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Cog } from 'lucide-react';

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
        <Button 
          variant="default" 
          size="sm" 
          disabled={isDisabled} 
          title="Process document"
          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
        >
          <Cog className="h-4 w-4" />
          <span className="sr-only">Process Document</span>
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
