
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FileItem } from '@/types/fileTypes';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-3 w-full">
      <div className="space-y-2 text-left">
        <label htmlFor="description" className="text-sm font-medium text-left block">
          Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe what happened in detail"
          value={description}
          onChange={onChange}
          rows={4}
          required
          className="w-full"
        />
      </div>

      <div className="space-y-2 text-left">
        <label className="text-sm font-medium text-left block">
          Supporting Documents (Optional)
        </label>
        <MultipleFilesUpload
          onFilesChange={onFilesChange}
          initialFiles={supportingFiles}
          maxFiles={5}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Upload up to 5 files (images, videos, documents) to support this incident report
        </p>
      </div>
    </div>
  );
};

export default DescriptionSection;
