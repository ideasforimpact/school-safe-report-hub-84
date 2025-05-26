
import { AssessmentTemplate, AssessmentQuestion } from '@/types/assessment';
import { templateService } from '@/services/assessment/templateService';

export const useQuestionManagement = (templates: AssessmentTemplate[], setTemplates: (templates: AssessmentTemplate[]) => void) => {
  
  const addQuestion = async (templateId: string, question: Omit<AssessmentQuestion, 'id'>) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const questionWithId = {
        ...question,
        id: `q_${Date.now()}_${template.questions.length}`
      };

      const updatedQuestions = [...template.questions, questionWithId];
      
      await templateService.updateTemplate(templateId, { questions: updatedQuestions });
      
      // Update local state
      const updatedTemplates = templates.map(t => 
        t.id === templateId 
          ? { ...t, questions: updatedQuestions }
          : t
      );
      setTemplates(updatedTemplates);
      
      return questionWithId.id;
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    }
  };

  const updateQuestion = async (templateId: string, questionId: string, updates: Partial<AssessmentQuestion>) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const updatedQuestions = template.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      );
      
      await templateService.updateTemplate(templateId, { questions: updatedQuestions });
      
      // Update local state
      const updatedTemplates = templates.map(t => 
        t.id === templateId 
          ? { ...t, questions: updatedQuestions }
          : t
      );
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  };

  const removeQuestion = async (templateId: string, questionId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const updatedQuestions = template.questions.filter(q => q.id !== questionId);
      
      await templateService.updateTemplate(templateId, { questions: updatedQuestions });
      
      // Update local state
      const updatedTemplates = templates.map(t => 
        t.id === templateId 
          ? { ...t, questions: updatedQuestions }
          : t
      );
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error removing question:', error);
      throw error;
    }
  };

  return {
    addQuestion,
    updateQuestion,
    removeQuestion
  };
};
