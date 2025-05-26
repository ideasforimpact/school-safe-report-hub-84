
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Assessment Templates</h3>
          <p className="text-sm text-gray-500">
            Manage assessment templates with yes/no questions
          </p>
        </div>
        <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>
      
      <TemplatesList onCreateTemplate={handleCreateTemplate} />
    </div>
  );
};

export default AssessmentConfigurationContent;
