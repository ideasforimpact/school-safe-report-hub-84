
import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../auth';
import { AssessmentContextType } from './types';
import { useTemplateManagement } from './hooks/useTemplateManagement';
import { useQuestionManagement } from './hooks/useQuestionManagement';
import { useAssignmentManagement } from './hooks/useAssignmentManagement';
import { useResponseManagement } from './hooks/useResponseManagement';
import { initializeMockData } from '@/components/assessments/data/initialMockData';

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};

export const AssessmentProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  
  // Initialize mock data when the app starts
  useEffect(() => {
    initializeMockData();
  }, []);
  
  // Set up template management
  const { 
    templates, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate, 
    getTemplateById,
    setTemplates
  } = useTemplateManagement(user?.id);
  
  // Set up assignment management
  const { 
    assignments, 
    createAssignment, 
    updateAssignment, 
    deleteAssignment, 
    getUserAssignments
  } = useAssignmentManagement(user?.id);

  // Set up question management with the setTemplates function
  const { 
    addQuestion, 
    updateQuestion, 
    removeQuestion 
  } = useQuestionManagement(templates, setTemplates);
  
  // Set up response management
  const { 
    responses, 
    createResponse, 
    updateResponse, 
    submitResponse, 
    getResponsesByAssignment, 
    getResponsesByUser 
  } = useResponseManagement(templates, updateAssignment);

  // Clean up related data when templates or assignments are deleted
  const handleDeleteTemplate = async (id: string) => {
    // Delete template
    await deleteTemplate(id);
    
    // Also delete related assignments and responses
    const relatedAssignments = assignments.filter(assignment => assignment.templateId === id);
    relatedAssignments.forEach(assignment => deleteAssignment(assignment.id));
  };

  const value = {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate: handleDeleteTemplate,
    getTemplateById,
    
    addQuestion,
    updateQuestion,
    removeQuestion,
    
    assignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getUserAssignments,
    
    responses,
    createResponse,
    updateResponse,
    submitResponse,
    getResponsesByAssignment,
    getResponsesByUser
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
};
