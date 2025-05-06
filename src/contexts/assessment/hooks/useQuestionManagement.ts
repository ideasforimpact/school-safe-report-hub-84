
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AssessmentQuestion, AssessmentTemplate } from '@/types/assessment';

export const useQuestionManagement = (
  templates: AssessmentTemplate[], 
  setTemplates: React.Dispatch<React.SetStateAction<AssessmentTemplate[]>> | ((templates: AssessmentTemplate[]) => void)
) => {
  const addQuestion = useCallback((templateId: string, questionData: Omit<AssessmentQuestion, 'id'>) => {
    const questionId = uuidv4();
    
    if (typeof setTemplates === 'function') {
      // Handle the custom setter function case
      const updatedTemplates = templates.map(template => 
        template.id === templateId 
          ? { 
              ...template, 
              questions: [
                ...template.questions, 
                { id: questionId, ...questionData }
              ] 
            } 
          : template
      );
      setTemplates(updatedTemplates);
    }
    
    return questionId;
  }, [setTemplates, templates]);

  const updateQuestion = useCallback((templateId: string, questionId: string, updates: Partial<Omit<AssessmentQuestion, 'id'>>) => {
    if (typeof setTemplates === 'function') {
      const updatedTemplates = templates.map(template => 
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
      );
      setTemplates(updatedTemplates);
    }
  }, [setTemplates, templates]);

  const removeQuestion = useCallback((templateId: string, questionId: string) => {
    if (typeof setTemplates === 'function') {
      const updatedTemplates = templates.map(template => 
        template.id === templateId 
          ? { 
              ...template, 
              questions: template.questions.filter(q => q.id !== questionId) 
            } 
          : template
      );
      setTemplates(updatedTemplates);
    }
  }, [setTemplates, templates]);

  return {
    addQuestion,
    updateQuestion,
    removeQuestion
  };
};
