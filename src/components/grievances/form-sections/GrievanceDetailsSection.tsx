
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { MessageSquare, FileText } from 'lucide-react';

interface GrievanceDetailsSectionProps {
  heading: string;
  setHeading: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  errors: Record<string, string>;
}

const GrievanceDetailsSection: React.FC<GrievanceDetailsSectionProps> = ({
  heading,
  setHeading,
  description,
  setDescription,
  errors
}) => {
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-5 w-5 text-gray-500" />
        <Label htmlFor="heading">Grievance Heading <span className="text-red-500">*</span></Label>
      </div>
      <div>
        <Input
          id="heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          className={errors.heading ? 'border-red-500' : ''}
          placeholder="Brief title or subject of your grievance"
        />
        {errors.heading && <p className="text-sm text-red-500 mt-1">{errors.heading}</p>}
      </div>
      
      <div className="flex items-center gap-2 mb-2 mt-6">
        <FileText className="h-5 w-5 text-gray-500" />
        <Label htmlFor="description">Description of your grievance <span className="text-red-500">*</span></Label>
      </div>
      <div>
<TextareaWithVoice
        id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide details about your grievance"
          className={errors.description ? 'border-red-500' : ''}
          rows={5}
        />
        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
      </div>
    </>
  );
};

export default GrievanceDetailsSection;
