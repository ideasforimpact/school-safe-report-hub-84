
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AssessmentQuestion } from '@/types/assessment';

export const useQuestionManagement = (
  templates: any[], 
  setTemplates: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const addQuestion = useCallback((templateId: string, questionData: Omit<AssessmentQuestion, 'id'>) => {
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
  }, [setTemplates]);

  const updateQuestion = useCallback((templateId: string, questionId: string, updates: Partial<Omit<AssessmentQuestion, 'id'>>) => {
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
  }, [setTemplates]);

  const removeQuestion = useCallback((templateId: string, questionId: string) => {
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
  }, [setTemplates]);

  return {
    addQuestion,
    updateQuestion,
    removeQuestion
  };
};
