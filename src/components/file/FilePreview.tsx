
import React, { useState } from 'react';
import { FileItem } from '@/types/fileTypes';
import { formatFileSize } from '@/utils/fileUtils';
import { Maximize2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface FilePreviewProps {
  file: FileItem;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  // Only allow preview for images with proper null check
  const canPreview = (file.type || '').startsWith('image/');

  const handlePreviewClick = () => {
    if (canPreview) {
      setPreviewOpen(true);
    }
  };

  return (
    <>
      {canPreview ? (
        <div 
          className="h-10 w-10 mr-2 rounded overflow-hidden flex-shrink-0 border cursor-pointer"
          onClick={handlePreviewClick}
        >
          <img 
            src={file.base64} 
            alt={file.name} 
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{file.name}</DialogTitle>
            <DialogDescription>
              {formatFileSize(file.size)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center py-4">
            <img 
              src={file.base64} 
              alt={file.name} 
              className="max-h-[70vh] max-w-full object-contain rounded-md"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FilePreview;
