
import React from 'react';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { FileItem } from '@/types/fileTypes';
import DragDropFileUpload from '@/components/file/DragDropFileUpload';

interface DescriptionSectionProps {
  description: string;
  supportingFiles: FileItem[];
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFilesChange: (files: FileItem[]) => void;
}

const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  description,
  supportingFiles,
  onChange,
  onFilesChange,
}) => {
  return (
    <>
      <div className="space-y-2 md:col-span-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-red-500">*</span>
        </label>
        <TextareaWithVoice
          id="description"
          name="description"
          placeholder="Describe what happened in detail"
          value={description}
          onChange={onChange}
          rows={4}
          required
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium">
          Supporting Documents (Optional)
        </label>
        <DragDropFileUpload
          onFilesChange={onFilesChange}
          initialFiles={supportingFiles}
          maxFiles={5}
        />
        <p className="text-xs text-gray-500 mt-1">
          Upload up to 5 files (images, videos, documents) to support this incident report
        </p>
      </div>
    </>
  );
};

export default DescriptionSection;
