
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  AssessmentTemplate, 
  AssessmentAssignment, 
  AssessmentResponse, 
  AssessmentQuestion 
} from '@/types/assessment';
import { useAuth } from './auth/AuthContext';

interface AssessmentContextType {
  // Templates
  templates: AssessmentTemplate[];
  createTemplate: (template: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => string;
  updateTemplate: (id: string, updates: Partial<Omit<AssessmentTemplate, 'id' | 'createdAt' | 'createdBy'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => AssessmentTemplate | undefined;
  
  // Questions
  addQuestion: (templateId: string, question: Omit<AssessmentQuestion, 'id'>) => string;
  updateQuestion: (templateId: string, questionId: string, updates: Partial<Omit<AssessmentQuestion, 'id'>>) => void;
  removeQuestion: (templateId: string, questionId: string) => void;
  
  // Assignments
  assignments: AssessmentAssignment[];
  createAssignment: (assignment: Omit<AssessmentAssignment, 'id' | 'assignedDate' | 'assignedBy' | 'status'>) => string;
  updateAssignment: (id: string, updates: Partial<Omit<AssessmentAssignment, 'id' | 'assignedDate' | 'assignedBy'>>) => void;
  deleteAssignment: (id: string) => void;
  getUserAssignments: (userId: string) => AssessmentAssignment[];
  
  // Responses
  responses: AssessmentResponse[];
  createResponse: (response: Omit<AssessmentResponse, 'id' | 'completedDate' | 'status' | 'score'>) => string;
  updateResponse: (id: string, updates: Partial<Omit<AssessmentResponse, 'id'>>) => void;
  submitResponse: (id: string) => void;
  getResponsesByAssignment: (assignmentId: string) => AssessmentResponse[];
  getResponsesByUser: (userId: string) => AssessmentResponse[];
}

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
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    const storedTemplates = localStorage.getItem('assessmentTemplates');
    const storedAssignments = localStorage.getItem('assessmentAssignments');
    const storedResponses = localStorage.getItem('assessmentResponses');

    if (storedTemplates) setTemplates(JSON.parse(storedTemplates));
    if (storedAssignments) setAssignments(JSON.parse(storedAssignments));
    if (storedResponses) setResponses(JSON.parse(storedResponses));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('assessmentTemplates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('assessmentAssignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('assessmentResponses', JSON.stringify(responses));
  }, [responses]);

  // Template management
  const createTemplate = (templateData: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
    const id = uuidv4();
    const newTemplate: AssessmentTemplate = {
      id,
      ...templateData,
      questions: [],
      createdAt: new Date().toISOString(),
      createdBy: user?.id || 'unknown',
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
    // Also delete related assignments and responses
    setAssignments(prev => prev.filter(assignment => assignment.templateId !== id));
    setResponses(prev => prev.filter(response => response.templateId !== id));
  };

  const getTemplateById = (id: string) => {
    return templates.find(template => template.id === id);
  };

  // Question management
  const addQuestion = (templateId: string, questionData: Omit<AssessmentQuestion, 'id'>) => {
    const questionId = uuidv4();
    
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { 
              ...template, 
              questions: [
                ...template.questions, 
                { id: questionId, ...questionData }
              ] 
            } 
          : template
      )
    );
    
    return questionId;
  };

  const updateQuestion = (templateId: string, questionId: string, updates: Partial<Omit<AssessmentQuestion, 'id'>>) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { 
              ...template, 
              questions: template.questions.map(question => 
                question.id === questionId 
                  ? { ...question, ...updates } 
                  : question
              ) 
            } 
          : template
      )
    );
  };

  const removeQuestion = (templateId: string, questionId: string) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { 
              ...template, 
              questions: template.questions.filter(q => q.id !== questionId) 
            } 
          : template
      )
    );
  };

  // Assignment management
  const createAssignment = (assignmentData: Omit<AssessmentAssignment, 'id' | 'assignedDate' | 'assignedBy' | 'status'>) => {
    const id = uuidv4();
    const newAssignment: AssessmentAssignment = {
      id,
      ...assignmentData,
      assignedDate: new Date().toISOString(),
      assignedBy: user?.id || 'unknown',
      status: 'Pending'
    };
    
    setAssignments(prev => [...prev, newAssignment]);
    return id;
  };

  const updateAssignment = (id: string, updates: Partial<Omit<AssessmentAssignment, 'id' | 'assignedDate' | 'assignedBy'>>) => {
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === id ? { ...assignment, ...updates } : assignment
      )
    );
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(assignment => assignment.id !== id));
    // Also delete related responses
    setResponses(prev => prev.filter(response => response.assignmentId !== id));
  };

  const getUserAssignments = (userId: string) => {
    return assignments.filter(assignment => assignment.userId === userId);
  };

  // Response management
  const createResponse = (responseData: Omit<AssessmentResponse, 'id' | 'completedDate' | 'status' | 'score'>) => {
    const id = uuidv4();
    const newResponse: AssessmentResponse = {
      id,
      ...responseData,
      completedDate: null,
      status: 'Draft',
      score: null
    };
    
    setResponses(prev => [...prev, newResponse]);

    // Update assignment status to 'In Progress'
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === responseData.assignmentId 
          ? { ...assignment, status: 'In Progress' } 
          : assignment
      )
    );
    
    return id;
  };

  const updateResponse = (id: string, updates: Partial<Omit<AssessmentResponse, 'id'>>) => {
    setResponses(prev => 
      prev.map(response => 
        response.id === id ? { ...response, ...updates } : response
      )
    );
  };

  const submitResponse = (id: string) => {
    const response = responses.find(r => r.id === id);
    if (!response) return;

    // Calculate score based on yes answers (if needed)
    const template = templates.find(t => t.templateId === response.templateId);
    const totalQuestions = template ? template.questions.length : 0;
    const yesAnswers = response.responses.filter(r => r.answer === true).length;
    const score = totalQuestions > 0 ? Math.round((yesAnswers / totalQuestions) * 100) : null;

    // Update response
    setResponses(prev => 
      prev.map(r => 
        r.id === id 
          ? { 
              ...r, 
              status: 'Submitted',
              completedDate: new Date().toISOString(),
              score
            } 
          : r
      )
    );

    // Update assignment status to 'Completed'
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === response.assignmentId 
          ? { ...assignment, status: 'Completed' } 
          : assignment
      )
    );
  };

  const getResponsesByAssignment = (assignmentId: string) => {
    return responses.filter(response => response.assignmentId === assignmentId);
  };

  const getResponsesByUser = (userId: string) => {
    return responses.filter(response => response.userId === userId);
  };

  const value = {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
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
