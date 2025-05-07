
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';

interface DocumentStatusButtonProps {
  document: VerificationDocument;
}

const DocumentStatusButton: React.FC<DocumentStatusButtonProps> = ({ document }) => {
  return (
    <Button 
      variant="outline"
      size="sm"
      className={document.verificationStatus === 'verified' 
        ? "text-green-700 border-green-200 bg-green-50 hover:bg-green-100 font-medium" 
        : "text-red-700 border-red-200 bg-red-50 hover:bg-red-100 font-medium"}
    >
      {document.verificationStatus === 'verified' ? (
        <>
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Verified
        </>
      ) : (
        <>
          <XCircle className="h-3.5 w-3.5 mr-1.5" />
          Failed
        </>
      )}
    </Button>
  );
};

export default DocumentStatusButton;
