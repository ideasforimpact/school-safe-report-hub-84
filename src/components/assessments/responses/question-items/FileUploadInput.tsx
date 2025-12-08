
import React from 'react';
import { Label } from '@/components/ui/label';
import { Paperclip } from 'lucide-react';
import { FileAttachment } from '@/types/assessment';

interface FileUploadInputProps {
  questionId: string;
  readOnly: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploadInput = ({ questionId, readOnly, onFileUpload }: FileUploadInputProps) => {
  if (readOnly) return null;
  
  return (
    <div className="mt-2">
      <input
        type="file"
        id={`file-${questionId}`}
        className="sr-only"
        onChange={onFileUpload}
        multiple
        accept=".pdf,.doc,.docx,.png,.jpeg,.jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/jpg"
      />
      <Label
        htmlFor={`file-${questionId}`}
        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
      >
        <Paperclip className="h-4 w-4 mr-1" />
        Attach files
      </Label>
    </div>
  );
};

export default FileUploadInput;
