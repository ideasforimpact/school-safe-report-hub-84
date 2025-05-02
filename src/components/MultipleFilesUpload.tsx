
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon, FileText, Video, File } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
}

interface MultipleFilesUploadProps {
  onFilesChange: (files: FileItem[]) => void;
  initialFiles?: FileItem[];
  maxFiles?: number;
  className?: string;
}

const MultipleFilesUpload = ({ 
  onFilesChange, 
  initialFiles = [], 
  maxFiles = 5,
  className = '' 
}: MultipleFilesUploadProps) => {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setIsUploading(true);
    
    // Check if adding new files would exceed the maximum
    if (files.length + selectedFiles.length > maxFiles) {
      alert(`You can upload a maximum of ${maxFiles} files.`);
      setIsUploading(false);
      return;
    }

    // Process each file
    const newFilesPromises = Array.from(selectedFiles).map(file => {
      // Validate file size (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 25MB size limit.`);
        return null;
      }

      return new Promise<FileItem | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            base64: reader.result as string
          });
        };
        reader.onerror = () => {
          alert(`Error reading file "${file.name}".`);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newFilesPromises).then(newFiles => {
      const validNewFiles = newFiles.filter(Boolean) as FileItem[];
      const updatedFiles = [...files, ...validNewFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
      setIsUploading(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 mr-2" />;
    } else if (fileType.startsWith('video/')) {
      return <Video className="h-4 w-4 mr-2" />;
    } else if (fileType.startsWith('application/pdf') || 
               fileType.startsWith('application/msword') ||
               fileType.includes('document')) {
      return <FileText className="h-4 w-4 mr-2" />;
    } else {
      return <File className="h-4 w-4 mr-2" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
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
      />
      
      <div className="border rounded-md p-4">
        {files.length > 0 && (
          <ScrollArea className="h-[200px] mb-4">
            <div className="space-y-2">
              {files.map(file => (
                <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <div className="flex items-center overflow-hidden">
                    {getFileTypeIcon(file.type)}
                    <span className="text-sm font-medium truncate">{file.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {formatFileSize(file.size)}
                    </Badge>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {files.length < maxFiles && (
          <div 
            className="border border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center bg-gray-50 cursor-pointer"
            onClick={triggerFileInput}
          >
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Click to upload files</p>
            <p className="text-xs text-gray-500 mt-1">
              Images, videos, documents up to 25MB
            </p>
            <Button 
              type="button" 
              variant="outline" 
              className="mt-4" 
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              {files.length}/{maxFiles} files uploaded
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultipleFilesUpload;
