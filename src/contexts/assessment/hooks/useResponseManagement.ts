
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AssessmentResponse, AssessmentTemplate } from '@/types/assessment';

export const useResponseManagement = (
  templates: AssessmentTemplate[],
  updateAssignment: (id: string, updates: Partial<any>) => void
) => {
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  
  // Load data from localStorage on initial render
  useEffect(() => {
    const storedResponses = localStorage.getItem('assessmentResponses');
    if (storedResponses) setResponses(JSON.parse(storedResponses));
  }, []);
  
  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('assessmentResponses', JSON.stringify(responses));
  }, [responses]);
  
  const createResponse = useCallback((responseData: Omit<AssessmentResponse, 'id' | 'completedDate' | 'status' | 'score'>) => {
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
    updateAssignment(responseData.assignmentId, { status: 'In Progress' });
    
    return id;
  }, [updateAssignment]);
  
  const updateResponse = useCallback((id: string, updates: Partial<Omit<AssessmentResponse, 'id'>>) => {
    setResponses(prev => 
      prev.map(response => 
        response.id === id ? { ...response, ...updates } : response
      )
    );
  }, []);
  
  const submitResponse = useCallback((id: string) => {
    const response = responses.find(r => r.id === id);
    if (!response) return;

    // Calculate score based on yes answers (if needed)
    const template = templates.find(t => t.id === response.templateId);
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

    // Update assignment status to 'Submitted'
    updateAssignment(response.assignmentId, { status: 'Submitted' });
  }, [responses, templates, updateAssignment]);
  
  const getResponsesByAssignment = useCallback((assignmentId: string) => {
    return responses.filter(response => response.assignmentId === assignmentId);
  }, [responses]);
  
  const getResponsesByUser = useCallback((userId: string) => {
    return responses.filter(response => response.userId === userId);
  }, [responses]);
  
  return {
    responses,
    createResponse,
    updateResponse,
    submitResponse,
    getResponsesByAssignment,
    getResponsesByUser
  };
};
