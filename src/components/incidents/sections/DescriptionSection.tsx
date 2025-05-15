
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
    <>
      <div className="space-y-2 md:col-span-2">
        <label htmlFor="description" className="text-sm font-medium block text-left">
          Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe what happened in detail"
          value={description}
          onChange={onChange}
          rows={4}
          className="w-full"
          required
          maxLength={250}
        />
        <p className="text-xs text-gray-500 text-right">
          {description.length}/250 characters
        </p>
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium block text-left">
          Supporting Documents <span className="text-red-500">*</span>
        </label>
        <MultipleFilesUpload
          onFilesChange={onFilesChange}
          initialFiles={supportingFiles}
          maxFiles={5}
          className="w-full"
          required
        />
        <p className="text-xs text-gray-500 mt-1 text-left">
          Upload up to 5 files (images, videos, documents) to support this incident report
        </p>
      </div>
    </>
  );
};

export default DescriptionSection;
