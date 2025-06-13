
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileCheck, RefreshCw } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';

interface DocumentStatusButtonProps {
  document: VerificationDocument;
}

const DocumentStatusButton: React.FC<DocumentStatusButtonProps> = ({ document }) => {
  const getStatusButton = () => {
    switch (document.verificationStatus) {
      case 'verified':
      case 'completed':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Verified',
          className: 'bg-green-600 hover:bg-green-700 text-white'
        };
      case 'failed':
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-4 w-4" />,
          label: 'Failed',
          className: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'in-progress':
        return {
          variant: 'default' as const,
          icon: <RefreshCw className="h-4 w-4" />,
          label: 'In Progress',
          className: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      case 'pending':
      default:
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-4 w-4" />,
          label: 'Pending',
          className: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
    }
  };

  const config = getStatusButton();

  return (
    <Button
      variant={config.variant}
      size="sm"
      className={`flex items-center gap-2 ${config.className}`}
      disabled
    >
      {config.icon}
      {config.label}
    </Button>
  );
};

export default DocumentStatusButton;
