import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, File, AlertCircle, FileText, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FileItem } from '@/types/fileTypes';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReusableFileUploaderProps {
  onFilesChange: (files: FileItem[]) => void;
  initialFiles?: FileItem[];
  maxFiles?: number;
  maxSize?: number; // in MB, default 10MB
  maxTotalSize?: number; // in MB, default 10MB
  allowedTypes?: string[]; // MIME types, default ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  accept?: string; // HTML accept attribute, default '.pdf,image/*'
  showFileList?: boolean; // Show file list, default true
  className?: string;
  disabled?: boolean;
}

const ReusableFileUploader: React.FC<ReusableFileUploaderProps> = ({
  onFilesChange,
  initialFiles = [],
  maxFiles = 5,
  maxSize = 10, // Default 10MB
  maxTotalSize = 10, // Default 10MB total
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  accept = '.pdf,image/*',
  showFileList = true,
  className = '',
  disabled = false,
}) => {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update parent when files change
  React.useEffect(() => {
    onFilesChange(files);
  }, [files, onFilesChange]);

  // Sync with initialFiles prop changes
  React.useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Clear any previous error messages
    setErrorMessage(null);

    // Convert FileList to Array and validate each file
    const fileArray = Array.from(fileList);
    
    // Check if adding new files would exceed the limit
    const currentFileCount = files.length;
    const newFileCount = fileArray.length;
    
    if (currentFileCount + newFileCount > maxFiles) {
      const errorMsg = `You can only upload a maximum of ${maxFiles} files. You currently have ${currentFileCount} file(s) selected.`;
      setErrorMessage(errorMsg);
      toast({
        title: 'Too many files',
        description: errorMsg,
        variant: 'destructive',
      });
      // Reset input
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    let processedCount = 0;
    let hasErrors = false;

    // Validate and process each file
    fileArray.forEach((file) => {
      // Check for duplicate filename
      const isDuplicate = files.some(existingFile => 
        existingFile.name.toLowerCase() === file.name.toLowerCase()
      );
      
      if (isDuplicate) {
        const errorMsg = `"${file.name}" is already selected. Duplicate file names are not allowed.`;
        setErrorMessage(errorMsg);
        toast({
          title: 'Duplicate file',
          description: errorMsg,
          variant: 'destructive',
        });
        hasErrors = true;
        processedCount++;
        if (processedCount === fileArray.length) {
          setIsProcessing(false);
        }
        return;
      }

      // File size validation (per file)
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        const errorMsg = `"${file.name}" is larger than ${maxSize}MB. Please select a smaller file.`;
        setErrorMessage(errorMsg);
        toast({
          title: 'File too large',
          description: errorMsg,
          variant: 'destructive',
        });
        hasErrors = true;
        processedCount++;
        if (processedCount === fileArray.length) {
          setIsProcessing(false);
        }
        return;
      }

      // File type validation
      if (!allowedTypes.includes(file.type)) {
        const typeNames = allowedTypes.map(type => {
          if (type === 'application/pdf') return 'PDF';
          if (type.includes('jpeg') || type.includes('jpg')) return 'JPG';
          if (type.includes('png')) return 'PNG';
          return type;
        }).join(', ');
        
        const errorMsg = `"${file.name}" is not a supported file type. Please upload ${typeNames} files.`;
        setErrorMessage(errorMsg);
        toast({
          title: 'Invalid file type',
          description: errorMsg,
          variant: 'destructive',
        });
        hasErrors = true;
        processedCount++;
        if (processedCount === fileArray.length) {
          setIsProcessing(false);
        }
        return;
      }

      // Check total size before reading the file
      const maxTotalSizeBytes = maxTotalSize * 1024 * 1024;
      const currentTotalSize = files.reduce((sum, f) => sum + f.size, 0);
      
      if (currentTotalSize + file.size > maxTotalSizeBytes) {
        const newTotalSize = currentTotalSize + file.size;
        const errorMsg = `Adding "${file.name}" would exceed the ${maxTotalSize}MB total size limit. Current total: ${(currentTotalSize / 1024 / 1024).toFixed(2)} MB, adding this file would make it ${(newTotalSize / 1024 / 1024).toFixed(2)} MB. Please remove some files or select smaller files.`;
        setErrorMessage(errorMsg);
        toast({
          title: 'Total file size too large',
          description: errorMsg,
          variant: 'destructive',
        });
        hasErrors = true;
        processedCount++;
        if (processedCount === fileArray.length) {
          setIsProcessing(false);
        }
        return;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        
        const newFile: FileItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${processedCount}`,
          name: file.name,
          size: file.size,
          type: file.type,
          base64: base64,
        };
        
        setFiles(prev => {
          // Clear error message when file is successfully added
          setErrorMessage(null);
          return [...prev, newFile];
        });
        
        processedCount++;
        if (processedCount === fileArray.length) {
          setIsProcessing(false);
        }
      };
      
      reader.onerror = () => {
        const errorMsg = `Error reading file "${file.name}".`;
        setErrorMessage(errorMsg);
        toast({
          title: 'File read error',
          description: errorMsg,
          variant: 'destructive',
        });
        processedCount++;
        if (processedCount === fileArray.length) {
          setIsProcessing(false);
        }
      };
      
      reader.readAsDataURL(file);
    });
    
    // Reset input to allow selecting the same file again if needed
    e.target.value = '';
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    // Clear error message when file is removed
    setErrorMessage(null);
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) {
      return <Image className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />;
    } else {
      return <File className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />;
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalSizeMB = formatFileSize(totalSize);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Message Alert */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="break-words">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}
      
      {/* File List */}
      {showFileList && files.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="text-xs text-gray-500 mb-2 px-1">
            {files.length} of {maxFiles} files selected • Total size: {totalSizeMB} MB
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto overflow-x-hidden pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
            {files.map((file) => (
              <div key={file.id} className="flex items-start justify-between p-2 bg-gray-50 rounded border min-h-[48px] w-full gap-2">
                <div className="flex items-start flex-1 min-w-0 overflow-hidden">
                  {getFileIcon(file.type)}
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <span className="text-sm break-words break-all block w-full text-gray-900">{file.name}</span>
                    <span className="text-xs text-gray-500 block mt-1">
                      {formatFileSize(file.size)} MB
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="h-8 w-8 p-0 flex-shrink-0 ml-2"
                  disabled={disabled}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center w-full overflow-hidden">
        <input 
          id="reusableFileUpload"
          type="file" 
          className="hidden"
          accept={accept}
          multiple
          onChange={handleFileUpload}
          disabled={disabled || isProcessing}
        />
        <div className="flex flex-col items-center justify-center w-full">
          <Upload className="h-8 w-8 text-gray-400 mb-2 flex-shrink-0" />
          <p className="text-sm text-gray-500 mb-1 break-words px-2">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-xs text-gray-400 break-words px-2">
            {allowedTypes.map(type => {
              if (type === 'application/pdf') return 'PDF';
              if (type.includes('jpeg') || type.includes('jpg')) return 'JPG';
              if (type.includes('png')) return 'PNG';
              return type;
            }).join(', ')} • Max size: {maxSize}MB per file • Max {maxFiles} files • Total: {maxTotalSize}MB
          </p>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            className="mt-2"
            onClick={() => document.getElementById('reusableFileUpload')?.click()}
            disabled={disabled || isProcessing || files.length >= maxFiles}
          >
            {isProcessing ? 'Processing...' : 'Browse Files'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReusableFileUploader;

