
import React from 'react';
import { FileItem } from '@/types/fileTypes';
import { formatFileSize } from '@/utils/fileUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize2, Trash2, FileText, ImageIcon, Video, File } from 'lucide-react';
import FilePreview from './FilePreview';

interface FileListItemProps {
  file: FileItem;
  onPreview: (file: FileItem) => void;
  onRemove: (id: string) => void;
}

const FileListItem: React.FC<FileListItemProps> = ({ file, onPreview, onRemove }) => {
  const getFileIcon = () => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 mr-2 flex-shrink-0" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="h-4 w-4 mr-2 flex-shrink-0" />;
    } else if (file.type.startsWith('application/pdf') || 
               file.type.includes('document')) {
      return <FileText className="h-4 w-4 mr-2 flex-shrink-0" />;
    } else {
      return <File className="h-4 w-4 mr-2 flex-shrink-0" />;
    }
  };

  return (
    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-200">
      <div className="flex items-center overflow-hidden flex-grow">
        {file.type.startsWith('image/') ? (
          <div className="flex items-center cursor-pointer" onClick={() => onPreview(file)}>
            <FilePreview file={file} />
            <div className="overflow-hidden">
              <span className="text-sm truncate block">{file.name}</span>
              <Badge variant="outline" className="mt-1">
                {formatFileSize(file.size)}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex items-center overflow-hidden">
            {getFileIcon()}
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
            onClick={() => onPreview(file)}
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
          onClick={() => onRemove(file.id)}
          className="flex-shrink-0 hover:bg-red-50"
          title="Delete file"
        >
          <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
        </Button>
      </div>
    </div>
  );
};

export default FileListItem;
