
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AssessmentTemplate } from '@/types/assessment';
import { toast } from 'sonner';

export const useTemplateManagement = (userId?: string) => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const storedTemplates = localStorage.getItem('assessmentTemplates');
      if (storedTemplates) setTemplates(JSON.parse(storedTemplates));
    } catch (error) {
      console.error('Failed to load templates from localStorage:', error);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('assessmentTemplates', JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save templates to localStorage:', error);
    }
  }, [templates]);

  const createTemplate = (templateData: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
    try {
      const id = uuidv4();
      const newTemplate: AssessmentTemplate = {
        id,
        ...templateData,
        questions: [],
        createdAt: new Date().toISOString(),
        createdBy: userId || 'unknown',
        isActive: true
      };
      
      setTemplates(prev => [...prev, newTemplate]);
      return id;
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
      throw error;
    }
  };

  const updateTemplate = (id: string, updates: Partial<Omit<AssessmentTemplate, 'id' | 'createdAt' | 'createdBy'>>) => {
    try {
      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? { ...template, ...updates } : template
        )
      );
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const deleteTemplate = (id: string) => {
    try {
      setTemplates(prev => prev.filter(template => template.id !== id));
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
  };
};
