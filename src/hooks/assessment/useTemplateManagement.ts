
import { useState, useEffect } from 'react';
import { AssessmentTemplate } from '@/types/assessmentTypes';
import { v4 as uuidv4 } from 'uuid';

// Mock storage key for local development
const STORAGE_KEY = 'assessment_templates';

export const useTemplateManagement = () => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    setIsLoading(true);
    
    // Load templates from localStorage
    try {
      const storedTemplates = localStorage.getItem(STORAGE_KEY);
      if (storedTemplates) {
        const parsedTemplates = JSON.parse(storedTemplates);
        
        // Convert date strings back to Date objects
        const templatesWithDates = parsedTemplates.map((template: any) => ({
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt)
        }));
        
        setTemplates(templatesWithDates);
      }
    } catch (error) {
      console.error('Error loading assessment templates:', error);
    }
    
    setIsLoading(false);
  }, []);

  // Save templates whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
      } catch (error) {
        console.error('Error saving templates to localStorage:', error);
      }
    }
  }, [templates, isLoading]);

  // Create a new template
  const createTemplate = (
    templateData: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date();
    const newId = uuidv4();
    
    const newTemplate: AssessmentTemplate = {
      ...templateData,
      id: newId,
      createdAt: now,
      updatedAt: now
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    
    // Log for debugging
    console.log('Created new template with ID:', newId);
    
    return newTemplate;
  };

  // Update an existing template
  const updateTemplate = (id: string, data: Partial<Omit<AssessmentTemplate, 'id' | 'createdAt'>>) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === id 
          ? { ...template, ...data, updatedAt: new Date() } 
          : template
      )
    );
  };

  // Delete a template
  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  };

  // Update template status
  const updateTemplateStatus = (templateId: string, status: AssessmentTemplate['status']) => {
    updateTemplate(templateId, { status });
  };

  // Get template by ID
  const getTemplateById = (id: string) => {
    const template = templates.find(template => template.id === id);
    if (!template) {
      console.error(`Template with id ${id} not found`);
    }
    return template;
  };

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    updateTemplateStatus,
    getTemplateById
  };
};
