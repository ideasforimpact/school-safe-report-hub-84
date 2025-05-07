
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { VerificationDocument } from '@/types/employeeVerification';
import VerificationStatusBadge from './VerificationStatusBadge';
import DocumentMetadata from './document-card/DocumentMetadata';
import DocumentImagePreview from './document-card/DocumentImagePreview';
import DocumentActions from './document-card/DocumentActions';
import DocumentStatusButton from './document-card/DocumentStatusButton';
import DocumentDeleteButton from './document-card/DocumentDeleteButton';

interface DocumentCardProps {
  document: VerificationDocument;
  showVerifyButton?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, showVerifyButton = true }) => {
  // Different card styles based on verification status
  const getCardStyle = () => {
    if (document.verificationStatus === 'verified') {
      return 'border-green-200 ring-1 ring-green-100 bg-gradient-to-br from-white to-green-50';
    } else if (document.verificationStatus === 'failed') {
      return 'border-red-200 ring-1 ring-red-100 bg-gradient-to-br from-white to-red-50';
    } else {
      return 'border-yellow-100 hover:border-yellow-200 transition-all bg-gradient-to-br from-white to-yellow-50';
    }
  };

  return (
    <Card className={`h-full shadow-sm ${getCardStyle()}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <DocumentMetadata 
            documentType={document.documentType}
            documentNumber={document.documentNumber}
            createdAt={document.createdAt}
            verificationStatus={document.verificationStatus}
            verificationDate={document.verificationDate}
            verificationNotes={document.verificationNotes}
            verificationMethod={document.verificationMethod}
          />
          <VerificationStatusBadge status={document.verificationStatus} />
        </div>
        
        <DocumentImagePreview documentImage={document.documentImage} />
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        {document.verificationStatus === 'pending' && showVerifyButton ? (
          <DocumentActions document={document} showVerifyButton={showVerifyButton} />
        ) : (
          <DocumentStatusButton document={document} />
        )}
        
        <DocumentDeleteButton documentId={document.id} />
      </CardFooter>
    </Card>
  );
};

export default DocumentCard;
