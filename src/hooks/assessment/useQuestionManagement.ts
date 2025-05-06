
import { AssessmentQuestion } from '@/types/assessmentTypes';
import { v4 as uuidv4 } from 'uuid';

export const useQuestionManagement = (
  templates: any[],
  updateTemplate: (id: string, data: any) => void
) => {
  // Add a question to a template
  const addQuestion = (templateId: string, question: Omit<AssessmentQuestion, 'id'>) => {
    const questionWithId: AssessmentQuestion = {
      ...question,
      id: uuidv4()
    };
    
    const templateToUpdate = templates.find(t => t.id === templateId);
    if (!templateToUpdate) return null;
    
    updateTemplate(templateId, { 
      questions: [...templateToUpdate.questions, questionWithId],
      updatedAt: new Date()
    });
    
    return questionWithId;
  };

  // Update a question
  const updateQuestion = (templateId: string, questionId: string, data: Partial<Omit<AssessmentQuestion, 'id'>>) => {
    const templateToUpdate = templates.find(t => t.id === templateId);
    if (!templateToUpdate) return;
    
    updateTemplate(templateId, { 
      questions: templateToUpdate.questions.map(q => 
        q.id === questionId ? { ...q, ...data } : q
      ),
      updatedAt: new Date()
    });
  };

  // Remove a question
  const removeQuestion = (templateId: string, questionId: string) => {
    const templateToUpdate = templates.find(t => t.id === templateId);
    if (!templateToUpdate) return;
    
    updateTemplate(templateId, { 
      questions: templateToUpdate.questions.filter(q => q.id !== questionId),
      updatedAt: new Date()
    });
  };

  return {
    addQuestion,
    updateQuestion,
    removeQuestion
  };
};
