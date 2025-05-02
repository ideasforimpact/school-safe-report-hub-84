
import React from 'react';
import { FileItem } from '@/types/incident';
import { Paperclip } from 'lucide-react';

interface FilePreviewProps {
  file: FileItem;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  if (file.type.startsWith('image/')) {
    return (
      <div className="border p-1 rounded bg-gray-50">
        <img 
          src={file.base64} 
          alt={file.name} 
          className="h-20 w-auto object-contain rounded" 
        />
        <p className="text-xs text-center truncate mt-1 max-w-[80px]">{file.name}</p>
      </div>
    );
  } else {
    return (
      <div className="border p-2 rounded bg-gray-50 flex flex-col items-center">
        <Paperclip className="h-10 w-10 text-gray-400" />
        <p className="text-xs text-center truncate mt-1 max-w-[80px]">{file.name}</p>
      </div>
    );
  }
};

export default FilePreview;
