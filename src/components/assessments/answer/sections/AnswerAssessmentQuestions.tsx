
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
  console.log('Rendering questions:', questions);
  console.log('Current answers state:', answers);
  
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No questions available for this assessment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const answer = answers.find(a => a.questionId === question.id);
        
        console.log(`Question ${index + 1}:`, question);
        console.log(`Answer for question ${question.id}:`, answer);
        
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
