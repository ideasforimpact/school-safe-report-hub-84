
import { useState, useEffect, useRef } from 'react';
import { AssessmentTemplate } from '@/types/assessment';
import { toast } from 'sonner';
import { templateService } from '@/services/assessment/templateService';
import { useAuth } from '@/contexts/auth';

export const useTemplateManagement = (userId?: string, enabled: boolean = true) => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const { employeeData } = useAuth();
  const fetchedForClientRef = useRef<string | null>(null);

  // Load templates from Supabase
  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      if (!employeeData?.clientId) {
        throw new Error('Client ID not available. Please ensure you are properly authenticated.');
      }
      
      const data = await templateService.getTemplates(employeeData.clientId);
      console.log('Loaded templates:', data);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load templates';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled || !employeeData?.clientId) return;
    if (fetchedForClientRef.current === employeeData.clientId) return;
    fetchedForClientRef.current = employeeData.clientId;
    loadTemplates();
  }, [employeeData?.clientId, enabled]);

  const createTemplate = async (templateData: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
    try {
      console.log('Creating template with data:', templateData);
      
      const id = await templateService.createTemplate({
        ...templateData,
        clientId: employeeData.clientId,
        createdBy: employeeData.id
      });
      console.log('Template created with ID:', id);
      toast.success('Template created successfully');
      await loadTemplates(); // Refresh the list
      return id;
    } catch (error) {
      console.error('Error creating template:', error);
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
