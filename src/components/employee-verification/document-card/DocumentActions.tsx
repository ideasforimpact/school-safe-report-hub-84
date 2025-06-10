
import React from 'react';
import { VerificationDocument } from '@/types/employeeVerification';
import DocumentImagePreview from './DocumentImagePreview';
import DocumentVerifyDropdown from './DocumentVerifyDropdown';
import DocumentDeleteButton from './DocumentDeleteButton';
import BankStatementDownloadButton from './BankStatementDownloadButton';

interface DocumentActionsProps {
  document: VerificationDocument;
  onVerify?: (status: 'verified' | 'failed', method?: 'api' | 'manual', notes?: string) => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({
  document,
  onVerify,
  onDelete,
  showActions = true
}) => {
  const handleVerify = (method: 'api' | 'manual') => {
    onVerify?.('verified', method);
  };

  if (!showActions) {
    return (
      <div className="flex items-center justify-end space-x-2">
        <DocumentImagePreview 
          documentImage={document.documentImage}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end space-x-2">
      <DocumentImagePreview 
        documentImage={document.documentImage}
      />
      
      <BankStatementDownloadButton
        documentId={document.id}
        cronLog={document.cronLog || []}
        verificationStatus={document.verificationStatus}
        documentStatusName={document.documentStatusName}
        documentType={document.documentTypeName}
      />
      
      <DocumentVerifyDropdown 
        onVerify={handleVerify}
        documentTypeName={document.documentTypeName}
        isDisabled={document.verificationStatus !== 'pending'}
      />
      
      <DocumentDeleteButton 
        documentId={document.id}
        onDocumentDeleted={onDelete}
      />
    </div>
  );
};

export default DocumentActions;
