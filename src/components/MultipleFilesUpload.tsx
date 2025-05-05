
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, ImageIcon, FileText, Video, File, FilePlus, Trash2, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 mr-2 flex-shrink-0" />;
    } else if (fileType.startsWith('video/')) {
      return <Video className="h-4 w-4 mr-2 flex-shrink-0" />;
    } else if (fileType.startsWith('application/pdf') || 
               fileType.startsWith('application/msword') ||
               fileType.includes('document')) {
      return <FileText className="h-4 w-4 mr-2 flex-shrink-0" />;
    } else {
      return <File className="h-4 w-4 mr-2 flex-shrink-0" />;
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
                    <div className="flex items-center overflow-hidden flex-grow">
                      {file.type.startsWith('image/') ? (
                        <div className="flex items-center cursor-pointer" onClick={() => openPreview(file)}>
                          <div className="h-10 w-10 mr-2 rounded overflow-hidden flex-shrink-0 border">
                            <img src={file.base64} alt={file.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="overflow-hidden">
                            <span className="text-sm truncate block">{file.name}</span>
                            <Badge variant="outline" className="mt-1">
                              {formatFileSize(file.size)}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center overflow-hidden">
                          {getFileTypeIcon(file.type)}
                          <span className="text-sm truncate">{file.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {formatFileSize(file.size)}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      {file.type.startsWith('image/') && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openPreview(file)}
                          className="flex-shrink-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          title="View image"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFile(file.id)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{previewFile?.name}</DialogTitle>
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
