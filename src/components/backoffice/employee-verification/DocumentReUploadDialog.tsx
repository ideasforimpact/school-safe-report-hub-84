
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VerificationDocument, Employee } from '@/types/employeeVerification';
import DocumentFileUploader from '@/components/employee-verification/form/DocumentFileUploader';
import { useFilesManagement } from '@/hooks/useFilesManagement';

interface DocumentReUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: VerificationDocument;
  employee: Employee;
  onDocumentUpdated: () => void;
}

const DocumentReUploadDialog: React.FC<DocumentReUploadDialogProps> = ({
  open,
  onOpenChange,
  document,
  employee,
  onDocumentUpdated
}) => {
  const { toast } = useToast();
  const { supportingFiles, handleFilesChange } = useFilesManagement();
  const [isUploading, setIsUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileUploaded = (base64: string, file?: File) => {
    console.log('File uploaded for re-upload:', file?.name);
  };

  const handleUpdateDocument = async () => {
    if (supportingFiles.length === 0) {
      toast({
        title: "No File Selected",
        description: "Please select a new document to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // TODO: Implement actual document update API call
      console.log('Updating document:', document.id, 'with new file:', supportingFiles[0]);
      
      toast({
        title: "Document Updated",
        description: "The document has been successfully updated.",
      });
      
      onDocumentUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewCurrentDocument = () => {
    if (document.documentImage) {
      window.open(document.documentImage, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Re-upload Document - {employee.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Document Preview */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium mb-3">Current Document</h3>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Document Type: {document.documentTypeName || 'Other'}</p>
                  {document.documentNumber && (
                    <p className="text-sm text-gray-600">Document Number: {document.documentNumber}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Uploaded: {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewCurrentDocument}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Current
                </Button>
              </div>
            </div>

            {/* New Document Upload */}
            <div>
              <h3 className="font-medium mb-3">Upload New Document</h3>
              <DocumentFileUploader
                files={supportingFiles}
                setFiles={handleFilesChange}
                onFileUploaded={handleFileUploaded}
                acceptedFileTypes="image/*,.pdf"
                maxFileSize={5}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateDocument}
                disabled={isUploading || supportingFiles.length === 0}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Update Document
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview Modal */}
      {previewOpen && document.documentImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="max-w-4xl max-h-screen p-4 relative">
            <Button
              variant="outline"
              className="absolute top-4 right-4 bg-white text-black z-10"
              onClick={() => setPreviewOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={document.documentImage}
              alt={`${document.documentTypeName} for ${employee.name}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentReUploadDialog;
