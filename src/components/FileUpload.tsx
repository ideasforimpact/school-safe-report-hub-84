
import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Video } from 'lucide-react';

interface FileUploadProps {
  initialFile?: string;
  onFileChange: (fileBase64: string | undefined) => void;
  className?: string;
  accept?: string;
  fileType: 'video' | 'document';
}

const FileUpload = ({ 
  initialFile, 
  onFileChange, 
  className = '',
  accept = 'video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  fileType 
}: FileUploadProps) => {
  const [previewFile, setPreviewFile] = useState<string | undefined>(initialFile);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFileName(file.name);
    
    // Validate file type
    if ((fileType === 'video' && !file.type.startsWith('video/')) &&
        (fileType === 'document' && !file.type.match(/pdf|msword|openxmlformats/))) {
      setIsUploading(false);
      alert(`Please upload a ${fileType} file`);
      return;
    }

    // Validate file size (max 50MB for videos, 10MB for documents)
    const maxSize = fileType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setIsUploading(false);
      alert(`Please upload a ${fileType} smaller than ${fileType === 'video' ? '50MB' : '10MB'}`);
      return;
    }

    // Convert to Base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreviewFile(base64String);
      onFileChange(base64String);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert('Error reading file');
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setPreviewFile(undefined);
    setFileName(undefined);
    onFileChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileTypeIcon = () => {
    return fileType === 'video' ? <Video className="h-12 w-12 text-gray-400 mb-2" /> : <FileText className="h-12 w-12 text-gray-400 mb-2" />;
  };

  return (
    <div className={`w-full ${className}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept={accept}
      />
      
      {previewFile ? (
        <div className="relative w-full border rounded-md p-3">
          {fileType === 'video' && previewFile.startsWith('data:video') ? (
            <video 
              src={previewFile} 
              controls 
              className="w-full h-48 object-contain"
            />
          ) : (
            <div className="flex items-center p-2">
              {getFileTypeIcon()}
              <span className="ml-2 text-sm font-medium truncate">{fileName || 'Uploaded file'}</span>
            </div>
          )}
          <Button 
            type="button" 
            variant="destructive" 
            size="sm" 
            className="absolute top-2 right-2"
            onClick={clearFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="border border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center h-48 bg-gray-50 cursor-pointer"
          onClick={triggerFileInput}
        >
          {getFileTypeIcon()}
          <p className="text-sm text-gray-600">Click to upload a {fileType}</p>
          <p className="text-xs text-gray-500 mt-1">
            {fileType === 'video' ? 'MP4, WebM, OGG up to 50MB' : 'PDF, DOC, DOCX up to 10MB'}
          </p>
          <Button 
            type="button" 
            variant="outline" 
            className="mt-4" 
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : `Upload ${fileType}`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
