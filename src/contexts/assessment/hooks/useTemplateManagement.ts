
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AssessmentTemplate } from '@/types/assessment';

export const useTemplateManagement = (userId?: string) => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    const storedTemplates = localStorage.getItem('assessmentTemplates');
    if (storedTemplates) setTemplates(JSON.parse(storedTemplates));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('assessmentTemplates', JSON.stringify(templates));
  }, [templates]);

  const createTemplate = (templateData: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
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
  };

  const updateTemplate = (id: string, updates: Partial<Omit<AssessmentTemplate, 'id' | 'createdAt' | 'createdBy'>>) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === id ? { ...template, ...updates } : template
      )
    );
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  };

  const getTemplateById = (id: string) => {
    return templates.find(template => template.id === id);
  };

  return {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateById,
  };
};
