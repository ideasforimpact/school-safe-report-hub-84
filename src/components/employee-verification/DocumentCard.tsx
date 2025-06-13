
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VerificationDocument } from '@/types/employeeVerification';
import VerificationStatusBadge from './VerificationStatusBadge';
import DocumentMetadata from './document-card/DocumentMetadata';
import DocumentImagePreview from './document-card/DocumentImagePreview';
import DocumentActions from './document-card/DocumentActions';
import DocumentStatusButton from './document-card/DocumentStatusButton';
import DocumentDeleteButton from './document-card/DocumentDeleteButton';
import DocumentCommentsDialog from './document-card/DocumentCommentsDialog';

interface DocumentCardProps {
  document: VerificationDocument;
  showVerifyButton?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, showVerifyButton = true }) => {
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);

  // Different card styles based on verification status
  const getCardStyle = () => {
    if (document.verificationStatus === 'verified' || document.verificationStatus === 'completed') {
      return 'border-green-100 shadow-sm hover:shadow-md';
    } else if (document.verificationStatus === 'failed' || document.verificationStatus === 'rejected') {
      return 'border-red-100 shadow-sm hover:shadow-md';
    } else if (document.verificationStatus === 'in-progress') {
      return 'border-blue-100 shadow-sm hover:shadow-md';
    } else {
      return 'border-yellow-100 shadow-sm hover:shadow-md';
    }
  };

  // Check if this is an "Other" document type
  const isOtherDocument = document.documentTypeName?.toLowerCase() === 'other';
  
  // Check if there are verification comments
  const hasVerificationHistory = document.params?.verification_history && 
    document.params.verification_history.length > 0;

  // Log document status for debugging
  console.log('DocumentCard - Document status:', {
    id: document.id,
    verificationStatus: document.verificationStatus,
    documentStatusName: document.documentStatusName,
    documentStatusId: document.documentStatusId
  });

  return (
    <>
      <Card className={`h-full transition-all duration-200 ${getCardStyle()}`}>
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {/* Show comment icon for Other documents with verification history */}
          {isOtherDocument && hasVerificationHistory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentsDialog(true)}
              className="h-8 w-8 p-0 bg-white/80 hover:bg-white border border-gray-200"
              title="View verification comments"
            >
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </Button>
          )}
          
          <VerificationStatusBadge 
            status={document.verificationStatus as 'verified' | 'failed' | 'pending' | 'in-progress' | 'completed' | 'rejected'} 
            documentStatusName={document.documentStatusName}
            documentLogs={document.employee_docs_log}
            documentId={document.id}
            documentType={document.documentTypeName?.toLowerCase()}
          />
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

      {/* Comments Dialog */}
      <DocumentCommentsDialog
        open={showCommentsDialog}
        onOpenChange={setShowCommentsDialog}
        document={document}
      />
    </>
  );
};

export default DocumentCard;
