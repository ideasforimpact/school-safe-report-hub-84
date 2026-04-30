
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateTemplateForm from '@/components/assessments/templates/CreateTemplateForm';
import TemplatesList from '@/components/assessments/templates/TemplatesList';
import TemplateDetailView from '@/components/assessments/templates/TemplateDetailView';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import Loader from '../common/Loader';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

interface AssessmentConfigurationContentProps {
  embedded?: boolean;
}

const AssessmentConfigurationContent = ({ embedded = false }: AssessmentConfigurationContentProps) => {
  const { getTemplateById, loading, refreshTemplates } = useAssessment();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [viewingTemplateId, setViewingTemplateId] = useState<string | null>(null);
  
  useEffect(() => {
    refreshTemplates();
  }, []);

  const handleCreateTemplate = () => {
    setEditingTemplateId(null);
    setShowCreateTemplate(true);
  };

  const handleEditTemplate = (templateId: string) => {
    setEditingTemplateId(templateId);
    setShowCreateTemplate(true);
  };

  const handleViewTemplate = (templateId: string) => {
    setViewingTemplateId(templateId);
    setShowCreateTemplate(false);
    setEditingTemplateId(null);
  };

  const handleCancelCreate = () => {
    setShowCreateTemplate(false);
    setEditingTemplateId(null);
  };

  const handleBackToList = () => {
    setViewingTemplateId(null);
    setShowCreateTemplate(false);
    setEditingTemplateId(null);
  };

  const handleEditFromDetail = () => {
    if (viewingTemplateId) {
      setEditingTemplateId(viewingTemplateId);
      setViewingTemplateId(null);
      setShowCreateTemplate(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader text="Loading assessment templates..." />
      </div>
    );
  }

  // Show template detail view
  if (viewingTemplateId) {
    const template = getTemplateById(viewingTemplateId);
    if (template) {
      return (
        <TemplateDetailView
          template={template}
          onBack={handleBackToList}
          onEdit={handleEditFromDetail}
        />
      );
    }
  }

  // Show create/edit form
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
      {!embedded && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Assessment Templates</h2>
            <p className="text-gray-600 mt-1">Manage assessment templates for your organization</p>
          </div>
        </div>
      )}
      
      <TemplatesList 
        onCreateTemplate={isReadOnlySwitchedContext ? undefined : handleCreateTemplate}
        onEditTemplate={handleEditTemplate}
        onViewTemplate={handleViewTemplate}
      />
    </div>
  );
};

export default AssessmentConfigurationContent;
