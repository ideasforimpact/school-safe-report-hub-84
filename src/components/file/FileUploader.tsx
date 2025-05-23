
import React, { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileSelect, 
  accept = '*', 
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = '' 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      setError(`File size exceeds the maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`);
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    // Check file type if accept is specified
    if (accept !== '*') {
      const fileType = file.type;
      const acceptedTypes = accept.split(',').map(type => type.trim());
      
      // Handle file extensions (e.g., .pdf, .jpg)
      const fileExtension = '.' + file.name.split('.').pop();
      
      const isAccepted = acceptedTypes.some(type => {
        // Check MIME type match
        if (fileType && type.includes('/')) {
          return fileType === type || fileType.startsWith(type.replace('*', ''));
        }
        // Check extension match
        return type === fileExtension;
      });

      if (!isAccepted) {
        setError(`File type not accepted. Please upload ${accept.replace(/,/g, ' or ')}`);
        setSelectedFile(null);
        onFileSelect(null);
        return;
      }
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFile(null);
    setError('');
    onFileSelect(null);
  };

  return (
    <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 ${className} ${error ? 'border-red-500' : ''}`}>
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      
      <div className="flex flex-col items-center justify-center space-y-2">
        {!selectedFile ? (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">Drag and drop a file here or</p>
            <Button 
              type="button" 
              variant="outline" 
              onClick={triggerFileInput}
            >
              Browse files
            </Button>
          </>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="truncate max-w-xs">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={triggerFileInput}
                >
                  Change
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={resetFile}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};
