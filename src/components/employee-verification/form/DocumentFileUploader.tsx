
import React, { useRef, useState } from 'react';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileItem } from '@/types/fileTypes';
import FileList from '@/components/file/FileList';
import { v4 as uuidv4 } from 'uuid';

interface DocumentFileUploaderProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  onFileUploaded: (base64: string, file?: File) => void;
  acceptedFileTypes?: string;
  documentType?: string;
  maxFileSize?: number; // in MB
}

const DocumentFileUploader: React.FC<DocumentFileUploaderProps> = ({ 
  files, 
  setFiles, 
  onFileUploaded,
  acceptedFileTypes = 'image/*,.pdf',
  documentType,
  maxFileSize = 5 // Default max size is 5MB
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const handlePreviewFile = (file: FileItem) => {
    // Preview logic would go here in a real app
    console.log('Preview file:', file);
  };

  const processFile = (file: File) => {
    // Special validation for bank account documents
    if (documentType === 'bank_account' && !file.type.includes('pdf')) {
      toast({
        title: 'Invalid file type',
        description: 'Bank statements must be uploaded as PDF files only',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // File size validation
    const maxSizeBytes = maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: 'File too large',
        description: `Please upload a file smaller than ${maxFileSize}MB`,
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      
      const newFile: FileItem = {
        id: uuidv4(),
        name: file.name,
        size: file.size,
        type: file.type,
        base64: base64,
      };
      
      setFiles([...files, newFile]);
      
      // Pass the base64 string and original file up to the parent component
      onFileUploaded(base64, file);
    };
    
    reader.onerror = () => {
      toast({
        title: 'Error reading file',
        description: 'An error occurred while processing the file',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      processFile(droppedFiles[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  // Get helper text based on document type
  const getHelperText = () => {
    if (documentType === 'bank_account') {
      // For manual verification we allow any file type
      return 'Supported formats: Any • Max file size: 5MB';
    }
    return 'Supported formats: JPG, PNG, PDF • Max file size: 5MB';
  };

  return (
    <div className="space-y-2">
      <div 
        className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleDropZoneClick}
      >
        <Upload className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 mb-2">Drag and drop file here, or click to select file</p>
        <p className="text-xs text-gray-400">{getHelperText()}</p>
        <Input 
          id={`file-upload-${documentType || 'default'}`}
          type="file" 
          className="hidden"
          ref={fileInputRef}
          accept={acceptedFileTypes}
          onChange={handleFileUpload}
        />
        <Button 
          type="button" 
          variant="outline" 
          className="mt-4"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Browse Files
        </Button>
      </div>
      
      {files.length > 0 && (
        <FileList 
          files={files} 
          onPreviewFile={handlePreviewFile}
          onRemoveFile={handleRemoveFile}
        />
      )}
    </div>
  );
};

export default DocumentFileUploader;
