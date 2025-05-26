
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
      console.log('Loaded templates:', data);
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
      console.log('Creating template with data:', templateData);
      const id = await templateService.createTemplate(templateData);
      console.log('Template created with ID:', id);
      toast.success('Template created successfully');
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
      toast.success('Template updated successfully');
      await loadTemplates(); // Refresh the list
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await templateService.deleteTemplate(id);
      toast.success('Template deleted successfully');
      await loadTemplates(); // Refresh the list
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
      throw error;
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
