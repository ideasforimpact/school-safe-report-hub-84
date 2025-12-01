
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FilePlus, AlertCircle, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { FileItem } from '@/types/fileTypes';
import { formatFileSize } from '@/utils/fileUtils';
import FileList from './file/FileList';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Allowed file types: PDF, DOC, DOCX, PNG, JPEG, JPG
  const ALLOWED_FILE_TYPES = [
    'application/pdf', // PDF
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'image/png', // PNG
    'image/jpeg', // JPEG
    'image/jpg' // JPG
  ];

  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpeg', '.jpg'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const isValidFileType = (file: File): boolean => {
    // Check by MIME type
    if (ALLOWED_FILE_TYPES.includes(file.type)) {
      return true;
    }
    
    // Fallback: Check by file extension
    const fileName = file.name.toLowerCase();
    return ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  };

  const getFileTypeError = (fileName: string): string => {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return `File "${fileName}" has an invalid format. Allowed formats: PDF, DOC, DOCX, PNG, JPEG, JPG.`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    // Clear any previous error
    setErrorMessage(null);
    
    // Check if adding new files would exceed the maximum
    if (files.length + selectedFiles.length > maxFiles) {
      const errorMsg = `You can upload a maximum of ${maxFiles} files. You currently have ${files.length} file(s) uploaded.`;
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Process selected file (single file approach)
    const file = selectedFiles[0];
    
    // Validate file type
    if (!isValidFileType(file)) {
      const errorMsg = getFileTypeError(file.name);
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `File "${file.name}" exceeds the 10MB size limit. Maximum file size is 10MB.`;
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Create file object immediately without base64 conversion for instant display
    // Base64 conversion is not needed since we upload File objects directly to storage
      const newFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
      type: file.type || '',
        size: file.size,
      file: file, // Store File object for direct upload
      url: URL.createObjectURL(file) // Create blob URL for preview
      };
      
      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    
    // Clear any error on success
    setErrorMessage(null);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success(`File "${file.name}" added successfully`);
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
        accept=".pdf,.doc,.docx,.png,.jpeg,.jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/jpg" 
        required={required}
      />
      
      <div className="border rounded-md p-4 bg-white">
        {/* Error Message at the top */}
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{errorMessage}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-transparent"
                onClick={() => setErrorMessage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
            PDF, DOC, DOCX, PNG, JPEG, JPG up to 10MB per file
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
            {previewFile && (previewFile.type || '').startsWith('image/') && (
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
