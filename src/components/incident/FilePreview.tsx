
import React from 'react';
import { FileItem } from '@/types/incident';
import { Paperclip, FileText, ImageIcon, Video, File } from 'lucide-react';

interface FilePreviewProps {
  file: FileItem;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 mr-2 flex-shrink-0" />;
    } else if (fileType.startsWith('video/')) {
      return <Video className="h-4 w-4 mr-2 flex-shrink-0" />;
    } else if (fileType.startsWith('application/pdf') || 
               fileType.includes('document')) {
      return <FileText className="h-4 w-4 mr-2 flex-shrink-0" />;
    } else {
      return <File className="h-4 w-4 mr-2 flex-shrink-0" />;
    }
  };

  if (file.type.startsWith('image/')) {
    return (
      <div className="border p-2 rounded bg-gray-50 w-full">
        <img 
          src={file.base64} 
          alt={file.name} 
          className="h-20 w-auto object-contain rounded mb-2" 
        />
        <div className="flex items-center">
          <ImageIcon className="h-4 w-4 mr-2 text-gray-500" />
          <p className="text-xs truncate">{file.name}</p>
        </div>
      </div>
    );
  } else {
    return (
      <div className="border p-2 rounded bg-gray-50 w-full">
        <div className="flex items-center">
          {getFileIcon(file.type)}
          <p className="text-xs truncate">{file.name}</p>
        </div>
      </div>
    );
  }
};

export default FilePreview;
