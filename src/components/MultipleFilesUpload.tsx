
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, ImageIcon, FileText, Video, File, FilePlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/sonner';

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
      />
      
      <div className="border rounded-md p-4 bg-white">
        {/* File List */}
        {files.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Added Files ({files.length}/{maxFiles})</h4>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-200">
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
          </div>
        )}

        {/* Add Button - Only shown if under max files */}
        {files.length < maxFiles && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={triggerFileInput} 
            className="w-full py-6 border-dashed flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100"
            disabled={isUploading}
          >
            <FilePlus className="h-8 w-8 mb-2 text-gray-500" />
            <span className="font-medium">
              {isUploading ? 'Adding file...' : 'Add a file'}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Images, videos, documents up to 25MB
            </p>
          </Button>
        )}
        
        {/* Counter showing files added */}
        <div className="mt-2 text-xs text-right text-gray-500">
          {files.length} of {maxFiles} files added
        </div>
      </div>
    </div>
  );
};

export default MultipleFilesUpload;
