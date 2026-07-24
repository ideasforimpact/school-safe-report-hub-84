import { AssessmentQuestion, QuestionResponse } from '@/types/assessment';

export const getQuestionCorrectAnswer = (question?: Pick<AssessmentQuestion, 'correctAnswer'> | null) =>
  question?.correctAnswer ?? 'yes';

export const isAnswerCorrect = (
  question: Pick<AssessmentQuestion, 'correctAnswer'>,
  answer?: string
) => answer !== undefined && answer === getQuestionCorrectAnswer(question);

export const calculateAssessmentScore = (
  questions: Pick<AssessmentQuestion, 'id' | 'correctAnswer'>[] = [],
  responses: Pick<QuestionResponse, 'questionId' | 'answer'>[] = []
) => {
  if (questions.length === 0) return 0;

  const correctAnswers = questions.filter(question => {
    const response = responses.find(item => item.questionId === question.id);
    return isAnswerCorrect(question, response?.answer);
  }).length;

  return Math.round((correctAnswers / questions.length) * 100);
};
