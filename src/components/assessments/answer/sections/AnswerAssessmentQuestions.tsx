
import React from 'react';
import AnswerQuestionCard from '../components/AnswerQuestionCard';
import { AssessmentQuestion, QuestionResponse } from '@/types/assessment';

interface AnswerAssessmentQuestionsProps {
  questions: AssessmentQuestion[];
  answers: QuestionResponse[];
  onAnswerChange: (questionId: string, field: keyof QuestionResponse, value: QuestionResponse[keyof QuestionResponse]) => void;
}

const AnswerAssessmentQuestions = ({ questions, answers, onAnswerChange }: AnswerAssessmentQuestionsProps) => {
  return (
    <div className="space-y-4">
      {questions.map((question, index) => {
        const answer = answers.find(a => a.questionId === question.id);
        
        return (
          <AnswerQuestionCard
            key={question.id}
            question={question}
            answer={answer}
            index={index + 1}
            onAnswerChange={onAnswerChange}
          />
        );
      })}
    </div>
  );
};

export default AnswerAssessmentQuestions;
