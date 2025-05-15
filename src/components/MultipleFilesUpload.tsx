
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FilePlus } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { FileItem } from '@/types/fileTypes';
import { formatFileSize } from '@/utils/fileUtils';
import FileList from './file/FileList';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface MultipleFilesUploadProps {
  onFilesChange: (files: FileItem[]) => void;
  initialFiles?: FileItem[];
  maxFiles?: number;
  className?: string;
  required?: boolean;
}

const MultipleFilesUpload = ({ 
  onFilesChange, 
  initialFiles = [], 
  maxFiles = 5,
  className = '',
  required = false 
}: MultipleFilesUploadProps) => {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setIsUploading(true);
    
    // Check if adding new files would exceed the maximum
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`You can upload a maximum of ${maxFiles} files.`);
      setIsUploading(false);
      return;
    }

    // Process selected file (single file approach)
    const file = selectedFiles[0];
    
    // Validate file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast.error(`File "${file.name}" exceeds the 25MB size limit.`);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        base64: reader.result as string
      };
      
      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
      setIsUploading(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success(`File "${file.name}" added successfully`);
    };
    
    reader.onerror = () => {
      toast.error(`Error reading file "${file.name}".`);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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

  return (
    <div className={`w-full ${className}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
        required={required}
      />
      
      <div className="border rounded-md p-4 bg-white">
        {/* File List */}
        <FileList 
          files={files}
          onPreviewFile={openPreview}
          onRemoveFile={removeFile}
        />

        {/* Add Button - Only shown if under max files */}
        {files.length < maxFiles && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={triggerFileInput} 
            className="w-full py-6 border-dashed flex items-center justify-center bg-gray-50 hover:bg-gray-100"
            disabled={isUploading}
          >
            <FilePlus className="h-5 w-5 mr-2" />
            <span className="font-medium">
              {isUploading ? 'Adding file...' : 'Add a file'}
            </span>
          </Button>
        )}
        
        {/* Description text below the button */}
        {files.length < maxFiles && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Images, videos, documents up to 25MB
          </p>
        )}
        
        {/* Counter showing files added */}
        <div className="mt-2 text-xs text-right text-gray-500">
          {files.length} of {maxFiles} files added
        </div>

        {/* Required indicator if prop is true */}
        {required && files.length === 0 && (
          <p className="text-xs text-red-500 mt-1">
            At least one file is required
          </p>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{previewFile?.name}</DialogTitle>
            <DialogDescription>
              {previewFile ? formatFileSize(previewFile.size) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center py-4">
            {previewFile?.type.startsWith('image/') && (
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

export default MultipleFilesUpload;
