import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, File, AlertCircle, FileText, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FileItem } from '@/types/fileTypes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FileListItem from '../file/FileListItem';
import { formatFileSize } from '@/utils/fileUtils';

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
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
  };
  // Update parent when files change (only when files actually change, not when callback changes)
  React.useEffect(() => {
    onFilesChange(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // Helper function to extract file extension from filename
  const getFileExtension = (filename: string): string => {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.substring(lastDot).toLowerCase();
  };

  // Helper function to parse accept string and extract allowed extensions
  const getAllowedExtensions = React.useMemo((): Set<string> => {
    const extensions = new Set<string>();
    
    // MIME type to extension mapping
    const mimeToExtension: Record<string, string[]> = {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/jpg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/jfif': ['.jfif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    };

    // First, add extensions based on allowedTypes
    allowedTypes.forEach(type => {
      const extList = mimeToExtension[type] || [];
      extList.forEach(ext => extensions.add(ext));
    });

    // Then, parse accept string (e.g., ".pdf,image/*" or ".pdf,.jpg,.png")
    if (accept) {
      const acceptParts = accept.split(',').map(part => part.trim());
      acceptParts.forEach(part => {
        if (part.startsWith('.')) {
          // Direct extension (e.g., ".pdf")
          extensions.add(part.toLowerCase());
        } else if (part.includes('/*')) {
          // MIME type wildcard (e.g., "image/*")
          const baseType = part.split('/')[0];
          if (baseType === 'image') {
            // For image/*, add only the image extensions that are in allowedTypes
            allowedTypes.forEach(type => {
              if (type.startsWith('image/')) {
                const extList = mimeToExtension[type] || [];
                extList.forEach(ext => extensions.add(ext));
              }
            });
          } else if (baseType === 'application') {
            // For application/*, add only the application extensions that are in allowedTypes
            allowedTypes.forEach(type => {
              if (type.startsWith('application/')) {
                const extList = mimeToExtension[type] || [];
                extList.forEach(ext => extensions.add(ext));
              }
            });
          }
        } else if (part.includes('/')) {
          // MIME type (e.g., "image/jpeg")
          const extList = mimeToExtension[part] || [];
          extList.forEach(ext => extensions.add(ext));
        }
      });
    }

    return extensions;
  }, [accept, allowedTypes]);

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

      // Get allowed extensions (memoized)
      const fileExtension = getFileExtension(file.name);

      // Validate MIME type
      const isValidMimeType = allowedTypes.includes(file.type);
      
      // Validate file extension
      const isValidExtension = getAllowedExtensions.has(fileExtension);

      // Both MIME type and extension must be valid
      if (!isValidMimeType || !isValidExtension) {
        // Build user-friendly list of allowed extensions
        const typeSet = new Set<string>();
        allowedTypes.forEach(type => {
          if (type === 'application/pdf') typeSet.add('PDF');
          else if (type.includes('jpeg') || type.includes('jpg')) typeSet.add('JPG');
          else if (type.includes('png')) typeSet.add('PNG');
          else if (type.includes('msword') || type.includes('wordprocessingml')) typeSet.add('Word');
          else typeSet.add(type);
        });
        const typeNames = Array.from(typeSet).join(', ');
        
        // Build extension list for error message
        const extensionList = Array.from(getAllowedExtensions)
          .map(ext => ext.toUpperCase().replace('.', ''))
          .join(', ');
        
        const errorMsg = `"${file.name}" is not a supported file type. Please upload ${typeNames} files (${extensionList} extensions only).`;
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

  const formatFileSizetomb = (bytes: number): string => {
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
  const totalSizeMB = formatFileSizetomb(totalSize);

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
            {files.length} of {maxFiles} {maxFiles === 1 ? 'file' : 'files'} selected • Total size: {totalSizeMB} MB
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto overflow-x-hidden pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
            {files.map((file) => {
              const isImage = file.type?.startsWith("image/");

              return (
                <div key={file.id}>
                  {/* LEFT SIDE CONTENT */}
                  {isImage ? (
                    <FileListItem
                      key={file.id}
                      file={file}
                      onPreview={handlePreview}        
                      onRemove={removeFile}       
                    />
                  ) : (
                    <div className="flex items-start justify-between p-2 bg-gray-50 rounded border min-h-[48px] w-full gap-2">
                      <div className="flex items-start flex-1 min-w-0 overflow-hidden">
                        {getFileIcon(file.type)}
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <span className="text-sm break-words break-all block w-full text-gray-900 text-left">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500 block mt-1">
                            {formatFileSize(file.size)}
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
       {/* Simple preview dialog (example using shadcn Dialog) */}
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg max-w-3xl max-h-[90vh] p-4 shadow-lg relative"> {/* Added relative here */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col flex-grow pr-4">
                  <h1 className="font-semibold tracking-tight text-lg">
                    {previewFile.name}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatFileSize(previewFile.size)}
                  </p>
                </div>
              </div>

              <Button
                type='button'
                onClick={() => setPreviewFile(null)}
                className="
                    absolute right-4 top-4  rounded-sm opacity-70 
                    focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-whilte hover:bg-white"      
                    style={{borderRadius:12,padding:1,height:18,color:'black' }}>
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>

              {previewFile.type?.startsWith('image/') ? (
                <img
                  src={previewFile.base64}
                  alt={previewFile.name}
                  className="max-h-[70vh] max-w-full object-contain"
                />
              ) : (
                <iframe
                  src={previewFile.base64}
                  className="w-[80vw] h-[70vh]"
                  title={previewFile.name}
                />
              )}
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
          multiple={maxFiles > 1}
          onChange={handleFileUpload}
          disabled={disabled || isProcessing}
        />
        <div className="flex flex-col items-center justify-center w-full">
          <Upload className="h-8 w-8 text-gray-400 mb-2 flex-shrink-0" />
          <p className="text-sm text-gray-500 mb-1 break-words px-2">
            {maxFiles === 1 
              ? 'Drag and drop file here, or click to select file'
              : 'Drag and drop files here, or click to select files'}
          </p>
          <p className="text-xs text-gray-400 break-words px-2">
            {(() => {
              const typeSet = new Set<string>();
              allowedTypes.forEach(type => {
                if (type === 'application/pdf') typeSet.add('PDF');
                else if (type.includes('jpeg') || type.includes('jpg')) typeSet.add('JPG');
                else if (type.includes('png')) typeSet.add('PNG');
                else if (type.includes('msword') || type.includes('wordprocessingml')) typeSet.add('Word');
                else typeSet.add(type);
              });
              return Array.from(typeSet).join(', ');
            })()} • Max size: {maxSize}MB per file • Max {maxFiles} {maxFiles === 1 ? 'file' : 'files'} • Total: {maxTotalSize}MB
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

