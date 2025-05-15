
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import { FileItem } from '@/types/fileTypes';

interface DescriptionSectionProps {
  description: string;
  supportingFiles: FileItem[];
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFilesChange: (files: FileItem[]) => void;
  errors?: Record<string, string>;
}

const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  description,
  supportingFiles,
  onChange,
  onFilesChange,
  errors = {}
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Description</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium block">
            Provide a detailed description <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={onChange}
            placeholder="Describe what happened in detail"
            className={`min-h-32 ${errors.description ? "border-red-500" : ""}`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium block">
            Supporting Files (optional)
          </label>
          <MultipleFilesUpload
            files={supportingFiles}
            onFilesChange={onFilesChange}
            maxFiles={5}
            acceptedFileTypes="image/*, application/pdf, .doc, .docx"
          />
        </div>
      </div>
    </div>
  );
};

export default DescriptionSection;
