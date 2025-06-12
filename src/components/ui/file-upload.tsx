
import React, { useCallback, useState } from 'react';
import { FileItem } from '@/types/fileTypes';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onFilesChange: (files: FileItem[]) => void;
  selectedFiles: FileItem[];
  isUploading?: boolean;
  maxFiles?: number;
  acceptedTypes?: string;
  label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  selectedFiles,
  isUploading = false,
  maxFiles = 5,
  acceptedTypes = "image/*,application/pdf",
  label = "Upload Files"
}) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    if (selectedFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: FileItem[] = [];
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileItem: FileItem = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          base64: e.target?.result as string
        };
        
        newFiles.push(fileItem);
        
        if (newFiles.length === files.length) {
          onFilesChange([...selectedFiles, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Clear the input
    event.target.value = '';
  }, [selectedFiles, onFilesChange, maxFiles]);

  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = selectedFiles.filter(file => file.id !== fileId);
    onFilesChange(updatedFiles);
  }, [selectedFiles, onFilesChange]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          {label}
        </Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="text-sm text-gray-600 mb-2">
            Drop files here or click to browse
          </div>
          <input
            type="file"
            multiple
            accept={acceptedTypes}
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            className="pointer-events-none"
          >
            Choose Files
          </Button>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Selected Files ({selectedFiles.length}/{maxFiles})
          </Label>
          <div className="space-y-2">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  disabled={isUploading}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
