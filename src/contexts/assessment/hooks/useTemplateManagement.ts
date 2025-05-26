
import { useState, useEffect } from 'react';
import { AssessmentTemplate } from '@/types/assessment';
import { toast } from 'sonner';
import { templateService } from '@/services/assessment/templateService';

export const useTemplateManagement = (userId?: string) => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // Load templates from Supabase
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const createTemplate = async (templateData: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
    try {
      const id = await templateService.createTemplate(templateData);
      await loadTemplates(); // Refresh the list
      return id;
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
      throw error;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<Omit<AssessmentTemplate, 'id' | 'createdAt' | 'createdBy'>>) => {
    try {
      await templateService.updateTemplate(id, updates);
      await loadTemplates(); // Refresh the list
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await templateService.deleteTemplate(id);
      await loadTemplates(); // Refresh the list
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const getTemplateById = (id: string) => {
    return templates.find(template => template.id === id);
  };

  return {
    templates,
    setTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateById,
    loading,
    refreshTemplates: loadTemplates
  };
};
