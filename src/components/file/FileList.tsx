
import React from 'react';
import { FileItem } from '@/types/fileTypes';
import { ScrollArea } from '@/components/ui/scroll-area';
import FileListItem from './FileListItem';

interface FileListProps {
  files: FileItem[];
  onPreviewFile: (file: FileItem) => void;
  onRemoveFile: (id: string) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onPreviewFile, onRemoveFile }) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium mb-2">Added Files ({files.length})</h4>
      <ScrollArea className="h-[150px]">
        <div className="space-y-2">
          {files.map(file => (
            <FileListItem
              key={file.id}
              file={file}
              onPreview={onPreviewFile}
              onRemove={onRemoveFile}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileList;
