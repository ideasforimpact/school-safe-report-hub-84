
import { QuestionResponse } from '@/types/assessment';

export const useProgressCalculation = (
  questions: any[] = [], 
  responses: QuestionResponse[] = []
) => {
  // Calculate progress
  const totalQuestions = questions.length || 0;
  const answeredQuestions = responses.filter(r => r.answer !== undefined).length;
  const progressPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  
  return {
    progressPercentage,
    answeredQuestions,
    totalQuestions
  };
};
