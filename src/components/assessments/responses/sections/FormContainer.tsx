
import React from 'react';
import { AssessmentTemplate, QuestionResponse } from '@/types/assessment';
import AssessmentHeader from '../header/AssessmentHeader';
import FormError from '../error/FormError';
import FormActions from '../actions/FormActions';
import AllQuestionsForm from './AllQuestionsForm';

interface FormContainerProps {
  template: AssessmentTemplate;
  assessment: any; // Changed from assignment to assessment
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
  assessment,
  questionResponses,
  formError,
  saving,
  submitting,
  progressPercentage,
  isCompleted,
  isLastQuestion,
  handleResponseChange,
  handleSave,
  handleSubmit,
  goToNextQuestion
}: FormContainerProps) => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <AssessmentHeader 
        title={template.title}
        description={template.description}
        status={isCompleted ? 'Completed' : assessment.status}
        dueDate={assessment.target_completion_date}
        progressPercentage={progressPercentage}
      />
      
      <AllQuestionsForm
        questions={template.questions || []}
        questionResponses={questionResponses}
        onChange={handleResponseChange}
        isCompleted={isCompleted}
        progressPercentage={progressPercentage}
      />
      
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
