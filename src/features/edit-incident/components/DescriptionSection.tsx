
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FileItem } from '@/types/incident';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import ImageUpload from '@/components/ImageUpload';

interface DescriptionSectionProps {
  description: string;
  rootCause: string;
  image: string | undefined;
  supportingFiles: FileItem[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onImageChange: (imageBase64: string | undefined) => void;
  onFilesChange: (files: FileItem[]) => void;
}

const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  description,
  rootCause,
  image,
  supportingFiles,
  onChange,
  onImageChange,
  onFilesChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
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
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="image" className="text-sm font-medium">
          Incident Image (Optional)
        </label>
        <ImageUpload
          value={image}
          onChange={onImageChange}
          maxSize={1024 * 1024 * 5} // 5MB
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Supporting Documents (Optional)
        </label>
        <MultipleFilesUpload
          onFilesChange={onFilesChange}
          initialFiles={supportingFiles}
          maxFiles={5}
        />
        <p className="text-xs text-gray-500 mt-1">
          Upload up to 5 files (images, videos, documents) to support this incident report
        </p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="rootCause" className="text-sm font-medium">
          Root Cause Analysis (Optional)
        </label>
        <Textarea
          id="rootCause"
          name="rootCause"
          placeholder="Describe the underlying factors that contributed to this incident"
          value={rootCause}
          onChange={onChange}
          rows={3}
        />
      </div>
    </div>
  );
};

export default DescriptionSection;
