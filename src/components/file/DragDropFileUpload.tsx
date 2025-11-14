
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Eye, FileText, ImageIcon, Video, File } from 'lucide-react';
import { toast } from 'sonner';
import { FileItem } from '@/types/fileTypes';
import { formatFileSize } from '@/utils/fileUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExcludeFile {
  name: string;
  size: number;
}

interface DragDropFileUploadProps {
  onFilesChange: (files: FileItem[]) => void;
  initialFiles?: FileItem[];
  excludeFiles?: ExcludeFile[]; // Existing files to exclude (e.g., from database)
  maxFiles?: number;
  className?: string;
  required?: boolean;
}

const DragDropFileUpload: React.FC<DragDropFileUploadProps> = ({
  onFilesChange,
  initialFiles = [],
  excludeFiles = [],
  maxFiles = 5,
  className = '',
  required = false
}) => {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    } else if (fileType.startsWith('video/')) {
      return <Video className="h-4 w-4 text-purple-500" />;
    } else if (fileType.startsWith('application/pdf') || fileType.includes('document')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else {
      return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const processFiles = useCallback(async (selectedFiles: FileList) => {
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`You can upload a maximum of ${maxFiles} files.`);
      return;
    }

    setIsUploading(true);
    const newFiles: FileItem[] = [];
    const duplicateFiles: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Check for duplicate by name and size against current files
      const isDuplicateInCurrent = files.some(
        existingFile => existingFile.name === file.name && existingFile.size === file.size
      );

      // Check for duplicate by name and size against excluded files (existing documents)
      const isDuplicateInExcluded = excludeFiles.some(
        excludedFile => excludedFile.name === file.name && excludedFile.size === file.size
      );

      if (isDuplicateInCurrent || isDuplicateInExcluded) {
        duplicateFiles.push(file.name);
        continue;
      }
      
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds the 25MB size limit.`);
        continue;
      }

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const newFile: FileItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type || '',
          size: file.size,
          base64
        };

        newFiles.push(newFile);
      } catch (error) {
        toast.error(`Error reading file "${file.name}".`);
      }
    }

    // Show warning for duplicate files
    if (duplicateFiles.length > 0) {
      toast.warning(`${duplicateFiles.length} duplicate file(s) skipped: ${duplicateFiles.join(', ')}`);
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
      toast.success(`${newFiles.length} file(s) added successfully`);
    }

    setIsUploading(false);
  }, [files, maxFiles, onFilesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [processFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    const fileToRemove = files.find(file => file.id === id);
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    if (fileToRemove) {
      toast.success(`File "${fileToRemove.name}" removed`);
    }
  };

  const openPreview = (file: FileItem) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
        required={required && files.length === 0}
      />
      
      <div className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
            ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50'}
          `}
          onClick={files.length < maxFiles ? triggerFileInput : undefined}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          {isUploading ? (
            <div>
              <p className="text-lg font-medium text-gray-700">Uploading files...</p>
              <p className="text-sm text-gray-500">Please wait</p>
            </div>
          ) : files.length >= maxFiles ? (
            <div>
              <p className="text-lg font-medium text-gray-500">Maximum files reached</p>
              <p className="text-sm text-gray-400">Remove some files to add more</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Support for images, videos, PDFs, and documents up to 25MB each
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {files.length} of {maxFiles} files selected
              </p>
            </div>
          )}
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Selected Files ({files.length})</h4>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                >
                  {getFileIcon(file.type)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {file.type.startsWith('image/') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPreview(file)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required indicator */}
        {required && files.length === 0 && (
          <p className="text-xs text-red-500">
            At least one file is required
          </p>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-4">
            {previewFile && previewFile.type.startsWith('image/') && (
              <img
                src={previewFile.base64}
                alt={previewFile.name}
                className="max-h-[70vh] max-w-full object-contain rounded-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DragDropFileUpload;
