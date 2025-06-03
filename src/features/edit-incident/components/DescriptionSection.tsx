
import React from 'react';
import { FileItem } from '@/types/incident';
import { Textarea } from '@/components/ui/textarea';
import DragDropFileUpload from '@/components/file/DragDropFileUpload';
import ImageUpload from '@/components/ImageUpload';

interface DescriptionSectionProps {
  description: string;
  image?: string;
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Description</h3>
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Detailed Information <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe what happened in detail"
            value={description}
            onChange={onChange}
            rows={6}
            required
            className="resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Main Image
          </label>
          <ImageUpload
            onImageChange={onImageChange}
            initialImage={image}
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Supporting Documents</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Additional Files (Optional)
          </label>
          <DragDropFileUpload
            onFilesChange={onFilesChange}
            initialFiles={supportingFiles}
            maxFiles={5}
            className="min-h-52"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload up to 5 files (images, videos, documents) to support this incident report
          </p>
        </div>
      </div>
    </div>
  );
};

export default DescriptionSection;
