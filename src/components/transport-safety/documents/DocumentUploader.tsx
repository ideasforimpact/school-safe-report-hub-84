
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, File } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FileItem } from '@/types/fileTypes';
import { supabase } from '@/integrations/supabase/client';

interface DocumentUploaderProps {
  vehicleId: string;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ vehicleId, onClose, onSuccess }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Only allow a single file
    const file = fileList[0];
    if (!file) return;

      // Simple file validation
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        
        const newFile: FileItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          base64: base64,
        };
        
      setFiles([newFile]);
      };
      
      reader.readAsDataURL(file);
  };

  const removeFile = (fileId: string) => {
    setFiles(files.filter(file => file.id !== fileId));
  };

  const uploadDocuments = async () => {
    if (files.length === 0) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      
      // Prepare single file for upload
      const file = files[0];
      const filesForUpload = [{
        fileName: file.name,
        contentType: file.type,
        base64Data: file.base64
      }];
      
      // Use "Vehicle Documents" as the default name
      const documentName = "Vehicle Documents";
      
      // Call the edge function to handle the upload
      const { data, error } = await supabase.functions.invoke('upload-vehicle-document', {
        body: {
          vehicleId,
          files: filesForUpload,
          documentInfo: {
            name: documentName,
            type: 'upload',
            uploadedBy: 'user'
          }
        }
      });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(error.message);
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
      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border min-h-[48px] w-full">
              <div className="flex items-center flex-1 min-w-0 max-w-full">
                <File className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1 max-w-full">
                  <span className="text-sm break-words block w-full">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => removeFile(file.id)}
                className="h-8 w-8 p-0 flex-shrink-0 ml-2"
              >
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* File Upload Button */}
      <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center w-full">
        <input 
          id="fileUpload"
          type="file" 
          className="hidden"
          accept=".pdf,image/*"
          onChange={handleFileUpload} 
        />
        <div className="flex flex-col items-center justify-center w-full">
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-1 break-words">Drag and drop files here, or click to select files</p>
          <p className="text-xs text-gray-400">PDF, JPG, PNG • Max size: 10MB</p>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            className="mt-2"
            onClick={() => document.getElementById('fileUpload')?.click()}
          >
            Browse Files
          </Button>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button 
          onClick={uploadDocuments} 
          disabled={uploading || files.length === 0}
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      </div>
    </div>
  );
};

export default DocumentUploader;
