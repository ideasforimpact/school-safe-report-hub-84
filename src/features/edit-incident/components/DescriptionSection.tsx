
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import ImageUpload from '@/components/ImageUpload';

interface DescriptionSectionProps {
  description: string;
  rootCause: string;
  image: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onImageChange: (imageBase64: string | undefined) => void;
}

const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  description,
  rootCause,
  image,
  onChange,
  onImageChange,
}) => {
  return (
    <>
      <div className="space-y-2 md:col-span-2">
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

      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium">
          Image Documentation (Optional)
        </label>
        <ImageUpload 
          onImageChange={onImageChange}
          initialImage={image}
        />
      </div>
      
      <div className="space-y-2 md:col-span-2 pt-4">
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
    </>
  );
};

export default DescriptionSection;
