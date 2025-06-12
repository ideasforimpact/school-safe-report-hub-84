
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VerificationDocument, Employee } from '@/types/employeeVerification';
import DocumentFileUploader from '@/components/employee-verification/form/DocumentFileUploader';
import { useFilesManagement } from '@/hooks/useFilesManagement';
import { backofficeDocumentService } from '@/services/employee/backofficeDocumentService';

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
  const [actualFile, setActualFile] = useState<File | null>(null);

  console.log('DocumentReUploadDialog - Rendered with:', {
    documentId: document.id,
    employeeId: employee.id,
    clientId: employee.clientId,
    open
  });

  const handleFileUploaded = (base64: string, file?: File) => {
    console.log('DocumentReUploadDialog - File uploaded for re-upload:', file?.name);
    if (file) {
      setActualFile(file);
    }
  };

  // Override the files change to restrict to single file and capture actual File object
  const handleSingleFileChange = (files: any[]) => {
    console.log('DocumentReUploadDialog - Files changed:', files);
    // Restrict to single file
    const singleFile = files.slice(0, 1);
    handleFilesChange(singleFile);
    
    // Extract the actual File object if available
    if (singleFile.length > 0 && singleFile[0].file) {
      console.log('DocumentReUploadDialog - Actual file set:', singleFile[0].file.name);
      setActualFile(singleFile[0].file);
    }
  };

  const handleUpdateDocument = async () => {
    console.log('DocumentReUploadDialog - Update document clicked');
    console.log('DocumentReUploadDialog - State:', {
      actualFile: actualFile?.name,
      supportingFilesLength: supportingFiles.length,
      clientId: employee.clientId
    });

    if (!actualFile && supportingFiles.length === 0) {
      console.log('DocumentReUploadDialog - No file selected');
      toast({
        title: "No File Selected",
        description: "Please select a new document to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!employee.clientId) {
      console.log('DocumentReUploadDialog - No client ID found');
      toast({
        title: "Error",
        description: "Client ID not found.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Use the actual File object if available, otherwise fall back to supportingFiles
      const fileToUpload = actualFile || (supportingFiles[0] as any)?.file;
      
      console.log('DocumentReUploadDialog - File to upload:', fileToUpload?.name);
      
      if (!fileToUpload) {
        throw new Error('No valid file found for upload');
      }
      
      console.log('DocumentReUploadDialog - Starting upload to storage');
      // Upload file to storage
      const storagePath = await backofficeDocumentService.uploadToStorage(
        fileToUpload,
        employee.clientId,
        employee.id
      );
      
      console.log('DocumentReUploadDialog - File uploaded to storage path:', storagePath);
      
      console.log('DocumentReUploadDialog - Updating document with new URL');
      // Update document with new URL
      await backofficeDocumentService.reUploadDocument({
        documentId: document.id,
        clientId: employee.clientId,
        employeeId: employee.id,
        newDocumentUrl: storagePath
      });
      
      console.log('DocumentReUploadDialog - Document updated successfully');
      toast({
        title: "Document Updated",
        description: "The document has been successfully updated.",
      });
      
      onDocumentUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('DocumentReUploadDialog - Error updating document:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewCurrentDocument = () => {
    console.log('DocumentReUploadDialog - View current document clicked');
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
              <h3 className="font-medium mb-3">Upload New Document (Single File Only)</h3>
              <DocumentFileUploader
                files={supportingFiles}
                setFiles={handleSingleFileChange}
                onFileUploaded={handleFileUploaded}
                acceptedFileTypes="image/*,.pdf"
                maxFileSize={5}
              />
              {supportingFiles.length > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  File selected: {supportingFiles[0].name}
                </p>
              )}
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
                disabled={isUploading || (!actualFile && supportingFiles.length === 0)}
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
