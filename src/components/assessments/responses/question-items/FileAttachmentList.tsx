
import React from 'react';
import { Button } from '@/components/ui/button';
import { File, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { FileAttachment } from '@/types/assessment';

interface FileAttachmentListProps {
  files: FileAttachment[];
  readOnly: boolean;
  onRemoveFile: (fileId: string) => void;
}

const FileAttachmentList = ({ files, readOnly, onRemoveFile }: FileAttachmentListProps) => {
  if (files.length === 0) return null;
  
  return (
    <div className="mb-2">
      <Label className="text-sm text-gray-600">Attachments:</Label>
      <div className="space-y-2 mt-1">
        {files.map(file => (
          <div
            key={file.id}
            className="flex items-center bg-gray-50 border border-gray-200 rounded-md p-2"
          >
            <File className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm flex-1 truncate" title={file.name}>
              {file.name}
            </span>
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFile(file.id)}
                className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileAttachmentList;
