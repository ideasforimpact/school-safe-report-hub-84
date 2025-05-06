
import React from 'react';
import { QuestionResponse } from '@/types/assessment';
import QuestionResponseItem from '../QuestionResponseItem';

interface QuestionsListProps {
  currentQuestions: any[];
  questionResponses: QuestionResponse[];
  currentSection: number;
  handleResponseChange: (questionId: string, field: string, value: any) => void;
  isCompleted: boolean;
}

const QuestionsList = ({
  currentQuestions,
  questionResponses,
  currentSection,
  handleResponseChange,
  isCompleted
}: QuestionsListProps) => {
  if (currentQuestions.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
        No questions available for this section.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {currentQuestions.map((question, index) => (
        <QuestionResponseItem
          key={question.id}
          question={question}
          response={questionResponses.find(r => r.questionId === question.id)}
          index={index + (currentSection * 5)}
          onChange={handleResponseChange}
          readOnly={isCompleted}
        />
      ))}
    </div>
  );
};

export default QuestionsList;
