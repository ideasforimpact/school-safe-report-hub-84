
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateTemplateForm from '@/components/assessments/templates/CreateTemplateForm';
import TemplatesList from '@/components/assessments/templates/TemplatesList';

const AssessmentConfigurationContent = () => {
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const handleCreateTemplate = () => {
    setEditingTemplateId(null);
    setShowCreateTemplate(true);
  };

  const handleEditTemplate = (templateId: string) => {
    setEditingTemplateId(templateId);
    setShowCreateTemplate(true);
  };

  const handleCancelCreate = () => {
    setShowCreateTemplate(false);
    setEditingTemplateId(null);
  };

  if (showCreateTemplate) {
    return (
      <CreateTemplateForm 
        templateId={editingTemplateId || undefined}
        isEditMode={!!editingTemplateId}
        onCancel={handleCancelCreate} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Assessment Templates</h2>
          <p className="text-gray-600 mt-1">Manage assessment templates for your organization</p>
        </div>
      </div>
      
      <TemplatesList 
        onCreateTemplate={handleCreateTemplate}
        onEditTemplate={handleEditTemplate}
      />
    </div>
  );
};

export default AssessmentConfigurationContent;
