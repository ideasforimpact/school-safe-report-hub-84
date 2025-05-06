
import { useState, useEffect } from 'react';
import { 
  AssessmentTemplate, 
  AssessmentQuestion,
  AssessmentAssignment,
  AssessmentStatus 
} from '@/types/assessmentTypes';
import { v4 as uuidv4 } from 'uuid';

// Mock storage key for local development
const STORAGE_KEY = 'assessment_templates';
const ASSIGNMENTS_KEY = 'assessment_assignments';

export const useAssessments = () => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
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
      
      // Load assignments
      const storedAssignments = localStorage.getItem(ASSIGNMENTS_KEY);
      if (storedAssignments) {
        setAssignments(JSON.parse(storedAssignments));
      }
    } catch (error) {
      console.error('Error loading assessment data:', error);
    }
    
    setIsLoading(false);
  }, []);

  // Save templates whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    }
  }, [templates, isLoading]);

  // Save assignments whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
    }
  }, [assignments, isLoading]);

  // Create a new template and optionally assign it to users immediately
  const createTemplate = (
    templateData: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    userIds: string[] = [],
    dueDate?: Date
  ) => {
    const now = new Date();
    const newTemplate: AssessmentTemplate = {
      ...templateData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    
    // If userIds are provided, assign the template to those users
    if (userIds.length > 0) {
      assignTemplate(newTemplate.id, userIds, dueDate);
    }
    
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
    // Also delete any assignments for this template
    setAssignments(prev => prev.filter(assignment => assignment.templateId !== id));
  };

  // Add a question to a template
  const addQuestion = (templateId: string, question: Omit<AssessmentQuestion, 'id'>) => {
    const questionWithId: AssessmentQuestion = {
      ...question,
      id: uuidv4()
    };
    
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { 
              ...template, 
              questions: [...template.questions, questionWithId],
              updatedAt: new Date()
            } 
          : template
      )
    );
    
    return questionWithId;
  };

  // Update a question
  const updateQuestion = (templateId: string, questionId: string, data: Partial<Omit<AssessmentQuestion, 'id'>>) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { 
              ...template, 
              questions: template.questions.map(q => 
                q.id === questionId ? { ...q, ...data } : q
              ),
              updatedAt: new Date()
            } 
          : template
      )
    );
  };

  // Remove a question
  const removeQuestion = (templateId: string, questionId: string) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { 
              ...template, 
              questions: template.questions.filter(q => q.id !== questionId),
              updatedAt: new Date()
            } 
          : template
      )
    );
  };

  // Update template status
  const updateTemplateStatus = (templateId: string, status: AssessmentStatus) => {
    updateTemplate(templateId, { status });
  };

  // Assign template to users
  const assignTemplate = (templateId: string, userIds: string[], dueDate?: Date) => {
    const newAssignments = userIds.map(userId => ({
      id: uuidv4(),
      templateId,
      userId,
      dueDate,
      status: 'assigned' as const
    }));
    
    setAssignments(prev => [...prev, ...newAssignments]);
    return newAssignments;
  };

  // Get template by ID
  const getTemplateById = (id: string) => {
    return templates.find(template => template.id === id);
  };

  // Get assignments for a template
  const getAssignmentsByTemplate = (templateId: string) => {
    return assignments.filter(assignment => assignment.templateId === templateId);
  };

  // Get assignments for a user
  const getAssignmentsByUser = (userId: string) => {
    return assignments.filter(assignment => assignment.userId === userId);
  };

  return {
    templates,
    assignments,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addQuestion,
    updateQuestion,
    removeQuestion,
    updateTemplateStatus,
    assignTemplate,
    getTemplateById,
    getAssignmentsByTemplate,
    getAssignmentsByUser
  };
};
