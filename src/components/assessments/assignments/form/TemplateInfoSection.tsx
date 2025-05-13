
import React from 'react';
import { AssessmentTemplate } from '@/types/assessment';

interface TemplateInfoSectionProps {
  template: AssessmentTemplate;
}

const TemplateInfoSection: React.FC<TemplateInfoSectionProps> = ({ template }) => {
  return (
    <div>
      <h3 className="font-medium">Template Information</h3>
      <p className="text-gray-500 mb-2">You are assigning the following template:</p>
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="font-medium">{template.title}</p>
        <p className="text-sm text-gray-600">{template.description}</p>
        <div className="mt-2 flex items-center">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {template.type}
          </span>
          <span className="text-xs text-gray-500 ml-2">
            {template.questions.length} questions
          </span>
        </div>
      </div>
    </div>
  );
};

export default TemplateInfoSection;
