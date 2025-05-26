
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssessmentQuestion, QuestionResponse } from '@/types/assessment';
import QuestionResponseItem from '../QuestionResponseItem';
import { Progress } from '@/components/ui/progress';

interface AllQuestionsFormProps {
  questions: AssessmentQuestion[];
  questionResponses: QuestionResponse[];
  onChange: (questionId: string, field: string, value: any) => void;
  isCompleted: boolean;
  progressPercentage: number;
}

const AllQuestionsForm = ({
  questions,
  questionResponses,
  onChange,
  isCompleted,
  progressPercentage
}: AllQuestionsFormProps) => {
  if (!questions || questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No questions available for this assessment.</p>
        </CardContent>
      </Card>
    );
  }

  const answeredQuestions = questionResponses.filter(r => r.answer !== undefined).length;

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Assessment Progress</span>
            <span className="text-sm font-normal text-gray-600">
              {answeredQuestions} of {questions.length} questions answered
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="w-full h-3" />
          <p className="text-sm text-gray-600 mt-2">
            {progressPercentage.toFixed(0)}% complete
          </p>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <QuestionResponseItem
            key={question.id}
            question={question}
            response={questionResponses.find(r => r.questionId === question.id)}
            index={index}
            onChange={onChange}
            readOnly={isCompleted}
          />
        ))}
      </div>
    </div>
  );
};

export default AllQuestionsForm;
