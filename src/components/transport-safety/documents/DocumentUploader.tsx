
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { FileItem } from '@/types/fileTypes';
import { supabase } from '@/integrations/supabase/client';
import ReusableFileUploader from '@/components/common/ReusableFileUploader';

interface DocumentUploaderProps {
  vehicleId: string;
  clientId?: string;
  onClose: () => void;
  onSuccess?: (result: any) => void;
  documentName: string;
  disabled: boolean;
  existingDocumentNames: string[];
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ vehicleId, clientId, onClose, onSuccess , documentName, disabled,existingDocumentNames }) => {
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [duplicateError, setDuplicateError] = useState(""); 

  const uploadDocuments = async () => {
    if (files.length === 0) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    // Validate total file size (10MB limit for all files combined)
    const maxTotalSize = 10 * 1024 * 1024; // 10MB in bytes
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    if (totalSize > maxTotalSize) {
      const errorMsg = `The total size of all selected files (${(totalSize / 1024 / 1024).toFixed(2)} MB) exceeds the 10MB limit. Please remove some files or select smaller files.`;
      toast({
        title: 'Total file size too large',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      
      // Prepare multiple files for upload
      const filesForUpload = files.map(file => ({
        fileName: file.name,
        contentType: file.type,
        base64Data: file.base64
      }));
      
      // Use "Vehicle Documents" as the default name
      const finalDocumentName = documentName.trim() || "Vehicle Documents";
      
      // Call the edge function to handle the upload
      const { data, error } = await supabase.functions.invoke('upload-vehicle-document', {
        body: {
          vehicleId,
          clientId,
          files: filesForUpload,
          documentInfo: {
            name: finalDocumentName,
            type: 'upload',
            uploadedBy: 'user'
          }
        }
      });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(error.message);
      }
      if (existingDocumentNames.includes(documentName.trim().toLowerCase())) {
        toast({
          title: "Duplicate Document Name",
          description: "A document with this name already exists. Please choose another name.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: 'Files Uploaded',
        description: `Successfully uploaded ${files.length} file(s)`,
      });
      
      // Call onSuccess callback if provided
      if (onSuccess && data) {
        onSuccess(data);
      }
      
      onClose();

    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'An error occurred while uploading files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Reusable File Uploader Component */}
      <ReusableFileUploader
        onFilesChange={setFiles}
        initialFiles={files}
        maxFiles={5}
        maxSize={10}
        maxTotalSize={10}
        disabled={uploading || disabled}
      />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button 
          onClick={uploadDocuments} 
          disabled={uploading || files.length === 0 || disabled || duplicateError !== ""}
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      </div>
    </div>
  );
};

export default DocumentUploader;
