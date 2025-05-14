
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { VerificationDocument } from '@/types/employeeVerification';
import DocumentImagePreview from './document-card/DocumentImagePreview';
import DocumentMetadata from './document-card/DocumentMetadata';
import DocumentStatusButton from './document-card/DocumentStatusButton';
import DocumentDeleteButton from './document-card/DocumentDeleteButton';

interface DocumentCardProps {
  document: VerificationDocument;
  onView: () => void;
  onVerifyAadhar?: () => void;
  onVerifyPan?: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ 
  document, 
  onView,
  onVerifyAadhar,
  onVerifyPan
}) => {
  const showVerificationButton = document.verificationStatus === 'pending' && 
    (document.documentTypeName === 'aadhar' || document.documentTypeName === 'pan');
  
  const handleVerificationClick = () => {
    if (document.documentTypeName === 'aadhar' && onVerifyAadhar) {
      onVerifyAadhar();
    } else if (document.documentTypeName === 'pan' && onVerifyPan) {
      onVerifyPan();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">
            {document.documentTypeName?.toUpperCase() || 'Document'}
          </h4>
          <p className="text-xs text-gray-500">
            Uploaded {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
          </p>
        </div>
        <DocumentStatusButton status={document.verificationStatus} />
      </div>
      
      <DocumentImagePreview documentImage={document.documentImage} />
      
      <DocumentMetadata 
        documentTypeName={document.documentTypeName}
        documentNumber={document.documentNumber}
        createdAt={document.createdAt}
        verificationStatus={document.verificationStatus}
        documentStatusName={document.documentStatusName}
        verificationDate={document.verificationDate}
        verificationNotes={document.verificationNotes}
        verificationMethod={document.verificationMethod}
      />
      
      <div className="flex justify-between items-center pt-2">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye className="h-4 w-4 mr-1.5" />
            View
          </Button>
          
          {showVerificationButton && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={handleVerificationClick}
            >
              Verify Now
            </Button>
          )}
        </div>
        
        <DocumentDeleteButton documentId={document.id} />
      </div>
    </div>
  );
};

export default DocumentCard;
