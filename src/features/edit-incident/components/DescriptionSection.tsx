
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FileItem } from '@/types/incident';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import ImageUpload from '@/components/ImageUpload';

interface DescriptionSectionProps {
  description: string;
  image: string | undefined;
  supportingFiles: FileItem[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onImageChange: (imageBase64: string | undefined) => void;
  onFilesChange: (files: FileItem[]) => void;
}

const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  description,
  image,
  supportingFiles,
  onChange,
  onImageChange,
  onFilesChange,
}) => {
  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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
            className="w-full"
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
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload up to 5 files (images, videos, documents) to support this incident report
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="image" className="text-sm font-medium">
          Incident Image (Optional)
        </label>
        <ImageUpload
          initialImage={image}
          onImageChange={onImageChange}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default DescriptionSection;
