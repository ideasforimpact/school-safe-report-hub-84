
import React from 'react';
import { FileItem } from '@/types/fileTypes';
import { formatFileSize } from '@/utils/fileUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize2, Trash2, X, FileText, ImageIcon, Video, File } from 'lucide-react';
import FilePreview from './FilePreview';

interface FileListItemProps {
  file: FileItem;
  onPreview: (file: FileItem) => void;
  onRemove: (id: string) => void;
  /** 'trash' = red delete icon; 'close' = neutral X (e.g. remove to replace) */
  removeIconVariant?: 'trash' | 'close';
}

const FileListItem: React.FC<FileListItemProps> = ({
  file,
  onPreview,
  onRemove,
  removeIconVariant = 'trash',
}) => {
  const getFileIcon = () => {
    const fileType = file.type || '';
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

  const isImage = (file.type || '').startsWith('image/');

  return (
    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-200">
      <div className="flex items-center overflow-hidden flex-grow">
        {isImage ? (
          <div className="flex items-center cursor-pointer">
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
        {isImage && (
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
          className={
            removeIconVariant === 'close'
              ? 'flex-shrink-0 h-8 w-8 p-0'
              : 'flex-shrink-0 hover:bg-red-50'
          }
          title={removeIconVariant === 'close' ? 'Remove file' : 'Delete file'}
        >
          {removeIconVariant === 'close' ? (
            <X className="h-4 w-4 text-gray-500" />
          ) : (
            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default FileListItem;
