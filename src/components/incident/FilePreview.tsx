
import React, { useState } from 'react';
import { FileItem } from '@/types/fileTypes';
import { Paperclip, FileText, ImageIcon, Video, File, Maximize2 } from 'lucide-react';
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
      return <ImageIcon className="h-4 w-4 mr-2 flex-shrink-0" />;
    } else if (safeFileType.startsWith('video/')) {
      return <Video className="h-4 w-4 mr-2 flex-shrink-0" />;
    } else if (safeFileType.startsWith('application/pdf') || 
               safeFileType.includes('document')) {
      return <FileText className="h-4 w-4 mr-2 flex-shrink-0" />;
    } else {
      return <File className="h-4 w-4 mr-2 flex-shrink-0" />;
    }
  };

  const openPreview = () => {
    const safeFileType = file.type || '';
    if (safeFileType.startsWith('image/')) {
      setPreviewOpen(true);
    }
  };

  const safeFileType = file.type || '';
  const isImage = safeFileType.startsWith('image/');

  if (isImage) {
    return (
      <>
        <div 
          className="border p-2 rounded bg-gray-50 w-full cursor-pointer hover:bg-gray-100"
          onClick={openPreview}
        >
          <img 
            src={file.base64} 
            alt={file.name} 
            className="h-20 w-auto object-contain rounded mb-2" 
          />
          <div className="flex items-center">
            <ImageIcon className="h-4 w-4 mr-2 text-gray-500" />
            <p className="text-xs truncate">{file.name}</p>
            <Maximize2 className="h-3 w-3 ml-auto text-blue-500" />
          </div>
        </div>
        
        {/* Image Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg">{file.name}</DialogTitle>
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
  } else {
    return (
      <div className="border p-2 rounded bg-gray-50 w-full">
        <div className="flex items-center">
          {getFileIcon(safeFileType)}
          <p className="text-xs truncate">{file.name}</p>
        </div>
      </div>
    );
  }
};

export default FilePreview;
