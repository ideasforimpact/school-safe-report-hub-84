import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateTemplateForm from '@/components/assessments/templates/CreateTemplateForm';
import TemplatesList from '@/components/assessments/templates/TemplatesList';
const AssessmentConfigurationContent = () => {
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const handleCreateTemplate = () => {
    setShowCreateTemplate(true);
  };
  const handleCancelCreate = () => {
    setShowCreateTemplate(false);
  };
  if (showCreateTemplate) {
    return <CreateTemplateForm onCancel={handleCancelCreate} />;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          
          
        </div>
        
      </div>
      
      <TemplatesList onCreateTemplate={handleCreateTemplate} />
    </div>;
};
export default AssessmentConfigurationContent;