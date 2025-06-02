
import React, { useState } from 'react';
import { FileItem } from '@/types/fileTypes';
import { Paperclip, FileText, ImageIcon, Video, File, Maximize2, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FilePreviewProps {
  file: FileItem;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const getFileIcon = (fileType: string) => {
    const safeFileType = fileType || '';
    if (safeFileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />;
    } else if (safeFileType.startsWith('video/')) {
      return <Video className="h-4 w-4 mr-2 flex-shrink-0 text-purple-500" />;
    } else if (safeFileType.startsWith('application/pdf') || 
               safeFileType.includes('document')) {
      return <FileText className="h-4 w-4 mr-2 flex-shrink-0 text-red-500" />;
    } else {
      return <File className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />;
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = file.base64;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handlePreview = () => {
    const safeFileType = file.type || '';
    if (safeFileType.startsWith('image/') || safeFileType.startsWith('application/pdf')) {
      setPreviewOpen(true);
    }
  };

  const safeFileType = file.type || '';
  const isImage = safeFileType.startsWith('image/');
  const isPdf = safeFileType.startsWith('application/pdf');
  const canPreview = isImage || isPdf;

  return (
    <>
      <div className="border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
        {/* File thumbnail for images */}
        {isImage && file.base64 && (
          <div className="mb-3">
            <img 
              src={file.base64} 
              alt={file.name} 
              className="w-full h-20 object-cover rounded cursor-pointer"
              onClick={handlePreview}
            />
          </div>
        )}

        {/* File info */}
        <div className="flex items-start gap-2 mb-3">
          {getFileIcon(safeFileType)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {file.size ? formatFileSize(file.size) : 'Unknown size'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {canPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="flex items-center gap-1 text-xs"
            >
              <Eye className="h-3 w-3" />
              View
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-1 text-xs"
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-lg truncate">{file.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-4">
            {isImage ? (
              <img 
                src={file.base64} 
                alt={file.name} 
                className="max-h-[70vh] max-w-full object-contain rounded-md"
              />
            ) : isPdf ? (
              <iframe
                src={file.base64}
                className="w-full h-[70vh] border rounded-md"
                title={file.name}
              />
            ) : (
              <div className="text-center py-8">
                <File className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Preview not available for this file type</p>
                <Button onClick={handleDownload} className="mt-4">
                  Download to view
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FilePreview;
