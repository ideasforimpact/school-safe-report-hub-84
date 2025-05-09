
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface IncidentDescriptionSectionProps {
  description: string;
  rootCause: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  errors: Record<string, string>;
}

const IncidentDescriptionSection: React.FC<IncidentDescriptionSectionProps> = ({
  description,
  rootCause,
  onChange,
  errors,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium block">
          Description*
        </label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={onChange}
          placeholder="Describe what happened in detail"
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="rootCause" className="text-sm font-medium block">
          Root Cause (if known)
        </label>
        <Textarea
          id="rootCause"
          name="rootCause"
          value={rootCause}
          onChange={onChange}
          placeholder="Describe the root cause if known"
        />
      </div>
    </div>
  );
};

export default IncidentDescriptionSection;
