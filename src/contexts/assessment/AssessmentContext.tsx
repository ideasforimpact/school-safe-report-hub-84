
import React, { createContext, useContext } from 'react';
import { useAuth } from '../auth/AuthContext';
import { AssessmentContextType } from './types';
import { useTemplateManagement } from './hooks/useTemplateManagement';
import { useQuestionManagement } from './hooks/useQuestionManagement';
import { useAssignmentManagement } from './hooks/useAssignmentManagement';
import { useResponseManagement } from './hooks/useResponseManagement';

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
  
  // Set up template management
  const { 
    templates, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate, 
    getTemplateById 
  } = useTemplateManagement(user?.id);
  
  // Set up assignment management
  const { 
    assignments, 
    createAssignment, 
    updateAssignment, 
    deleteAssignment, 
    getUserAssignments, 
    setAssignments 
  } = useAssignmentManagement(user?.id);

  // Set up question management - fix the type issue here
  const { 
    addQuestion, 
    updateQuestion, 
    removeQuestion 
  } = useQuestionManagement(templates, (templates) => {
    // This wrapper ensures we're providing the expected setState function
    // that takes either a new state value or a function to update the state
    return (updater) => {
      if (typeof updater === 'function') {
        const updatedTemplates = updater(templates);
        // Fix: Pass the id and updates as separate arguments
        updateTemplate(updatedTemplates.id, updatedTemplates);
      } else {
        // Fix: Pass the id and updates as separate arguments
        updateTemplate(updater.id, updater);
      }
    };
  });
  
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
  const handleDeleteTemplate = (id: string) => {
    // Delete template
    deleteTemplate(id);
    
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
