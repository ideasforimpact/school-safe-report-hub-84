
import React from 'react';
import { AssessmentTemplate, AssessmentAssignment, QuestionResponse } from '@/types/assessment';
import AssessmentHeader from '../header/AssessmentHeader';
import FormError from '../error/FormError';
import FormActions from '../actions/FormActions';
import QuestionCard from './QuestionCard';
import QuestionNavigation from '../navigation/QuestionNavigation';

interface FormContainerProps {
  template: AssessmentTemplate;
  assignment: AssessmentAssignment;
  questionResponses: QuestionResponse[];
  formError: string | null;
  saving: boolean;
  submitting: boolean;
  currentSection: number;
  currentQuestionIndex: number;
  progressPercentage: number;
  currentQuestions: any[];
  groupedQuestions: any[][];
  isCompleted: boolean;
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
  handleResponseChange: (questionId: string, field: string, value: any) => void;
  handleSave: () => void;
  handleSubmit: () => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
}

const FormContainer = ({
  template,
  assignment,
  questionResponses,
  formError,
  saving,
  submitting,
  currentSection,
  currentQuestionIndex,
  progressPercentage,
  currentQuestions,
  groupedQuestions,
  isCompleted,
  isLastQuestion,
  isFirstQuestion,
  handleResponseChange,
  handleSave,
  handleSubmit,
  goToNextQuestion,
  goToPreviousQuestion
}: FormContainerProps) => {
  // Get the current question based on the index
  const currentQuestion = currentQuestions[currentQuestionIndex % currentQuestions.length];
  const totalQuestions = template.questions.length;
  const absoluteQuestionIndex = currentSection * 5 + currentQuestionIndex;
  
  // Find the response for the current question
  const currentResponse = questionResponses.find(
    r => r.questionId === currentQuestion?.id
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AssessmentHeader 
        title={template.title}
        description={template.description}
        status={isCompleted ? 'Completed' : assignment.status}
        dueDate={assignment.dueDate}
        progressPercentage={progressPercentage}
      />
      
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        {/* Question Progress Bar */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              Question {absoluteQuestionIndex + 1} of {totalQuestions}
            </div>
            <div className="text-sm text-gray-500">
              Section {currentSection + 1} of {groupedQuestions.length}
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${(absoluteQuestionIndex + 1) / totalQuestions * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Current Question Card */}
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            response={currentResponse}
            index={absoluteQuestionIndex}
            onChange={handleResponseChange}
            isCompleted={isCompleted}
          />
        )}
        
        {/* Question Navigation */}
        <QuestionNavigation 
          isFirstQuestion={isFirstQuestion}
          isLastQuestion={isLastQuestion}
          onPrevious={goToPreviousQuestion}
          onNext={goToNextQuestion}
        />
      </div>
      
      <FormError error={formError} />
      
      <FormActions 
        isCompleted={isCompleted}
        isLastQuestion={isLastQuestion}
        saving={saving}
        submitting={submitting}
        onSave={handleSave}
        onSubmit={handleSubmit}
        onNextQuestion={goToNextQuestion}
      />
    </div>
  );
};

export default FormContainer;
