
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { VerificationDocument } from '@/types/employeeVerification';
import VerificationStatusBadge from './VerificationStatusBadge';
import DocumentMetadata from './document-card/DocumentMetadata';
import DocumentImagePreview from './document-card/DocumentImagePreview';
import DocumentActions from './document-card/DocumentActions';
import DocumentStatusButton from './document-card/DocumentStatusButton';
import DocumentDeleteButton from './document-card/DocumentDeleteButton';
import DocumentCommentsDialog from './DocumentCommentsDialog';
import { useToast } from '@/hooks/use-toast';

interface DocumentCardProps {
  document: VerificationDocument;
  showVerifyButton?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, showVerifyButton = true }) => {
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Different card styles based on verification status
  const getCardStyle = () => {
    if (document.verificationStatus === 'verified' || document.verificationStatus === 'completed') {
      return 'border-green-100 shadow-sm hover:shadow-md';
    } else if (document.verificationStatus === 'failed') {
      return 'border-red-100 shadow-sm hover:shadow-md';
    } else if (document.verificationStatus === 'in-progress') {
      return 'border-blue-100 shadow-sm hover:shadow-md';
    } else {
      return 'border-yellow-100 shadow-sm hover:shadow-md';
    }
  };

  // Helper function to check if document has comments
  const hasVerificationHistory = (): boolean => {
    const verificationHistory = (document.params as any)?.verification_history;
    return Array.isArray(verificationHistory) && verificationHistory.length > 0;
  };

  // Check if this is an "Other" document type with verification history
  const showCommentsIcon = document.documentTypeName?.toLowerCase() === 'other' && hasVerificationHistory();

  const handleCommentsClick = () => {
    const verificationHistory = (document.params as any)?.verification_history || [];
    setCommentsDialogOpen(true);
    
    toast({
      title: "Viewing Comments",
      description: "Showing verification history and comments for this document."
    });
  };

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
          params={document.params}
        />
        </CardContent>
        
        <CardFooter className="border-t p-4 bg-gray-50 flex justify-between">
          <div className="flex items-center gap-2">
            {document.verificationStatus === 'pending' && showVerifyButton ? (
              <DocumentActions document={document} showVerifyButton={showVerifyButton} />
            ) : (
              <DocumentStatusButton document={document} />
            )}
            
            {showCommentsIcon && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCommentsClick}
                title="View comments and verification history"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="sr-only">Comments</span>
              </Button>
            )}
          </div>
          
          <DocumentDeleteButton documentId={document.id} />
        </CardFooter>
      </Card>

      {/* Comments Dialog */}
      <DocumentCommentsDialog
        open={commentsDialogOpen}
        onOpenChange={setCommentsDialogOpen}
        verificationHistory={(document.params as any)?.verification_history || []}
        documentId={document.id}
      />
    </>
  );
};

export default DocumentCard;
