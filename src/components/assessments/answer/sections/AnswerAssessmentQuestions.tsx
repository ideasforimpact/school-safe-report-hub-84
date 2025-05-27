
import React from 'react';
import AnswerQuestionCard from '../components/AnswerQuestionCard';

interface Question {
  id: string;
  text: string;
  required?: boolean;
  allowComments?: boolean;
}

interface AnswerAssessmentQuestionsProps {
  questions: Question[];
  answers: any[];
  onAnswerChange: (questionId: string, field: string, value: any) => void;
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
