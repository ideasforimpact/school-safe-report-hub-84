
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { VerificationDocument } from '@/types/employeeVerification';
import VerificationStatusBadge from './VerificationStatusBadge';
import DocumentMetadata from './document-card/DocumentMetadata';
import DocumentImagePreview from './document-card/DocumentImagePreview';
import DocumentActions from './document-card/DocumentActions';
import DocumentStatusButton from './document-card/DocumentStatusButton';
import DocumentDeleteButton from './document-card/DocumentDeleteButton';
import BankStatementDownloadIcon from './document-card/BankStatementDownloadIcon';

interface DocumentCardProps {
  document: VerificationDocument;
  showVerifyButton?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, showVerifyButton = true }) => {
  // Different card styles based on verification status
  const getCardStyle = () => {
    if (document.verificationStatus === 'verified') {
      return 'border-green-100 shadow-sm hover:shadow-md';
    } else if (document.verificationStatus === 'failed') {
      return 'border-red-100 shadow-sm hover:shadow-md';
    } else {
      return 'border-yellow-100 shadow-sm hover:shadow-md';
    }
  };

  return (
    <Card className={`h-full transition-all duration-200 ${getCardStyle()}`}>
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <VerificationStatusBadge 
          status={document.verificationStatus} 
          documentStatusName={document.documentStatusName}
          documentLogs={document.employee_docs_log}
          documentId={document.id}
          documentType={document.documentTypeName?.toLowerCase()}
        />
        <BankStatementDownloadIcon document={document} />
      </div>
      
      <CardContent className="p-4 pt-6">
        <DocumentImagePreview documentImage={document.documentImage} />
        <DocumentMetadata 
          documentTypeName={document.documentTypeName || ''}
          documentNumber={document.documentNumber}
          createdAt={document.createdAt}
          verificationStatus={document.verificationStatus}
          documentStatusName={document.documentStatusName}
          verificationDate={document.verificationDate}
          verificationNotes={document.verificationNotes}
          verificationMethod={document.verificationMethod}
        />
      </CardContent>
      
      <CardFooter className="border-t p-4 bg-gray-50 flex justify-between">
        <div className="flex items-center gap-2">
          {document.verificationStatus === 'pending' && showVerifyButton ? (
            <DocumentActions document={document} showVerifyButton={showVerifyButton} />
          ) : (
            <DocumentStatusButton document={document} />
          )}
        </div>
        
        <DocumentDeleteButton documentId={document.id} />
      </CardFooter>
    </Card>
  );
};

export default DocumentCard;
