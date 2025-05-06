
import React from 'react';
import { AssessmentTemplate, AssessmentAssignment, QuestionResponse } from '@/types/assessment';
import AssessmentHeader from '../header/AssessmentHeader';
import SectionNavigation from '../navigation/SectionNavigation';
import FormError from '../error/FormError';
import FormActions from '../actions/FormActions';
import QuestionsList from './QuestionsList';

interface FormContainerProps {
  template: AssessmentTemplate;
  assignment: AssessmentAssignment;
  questionResponses: QuestionResponse[];
  formError: string | null;
  saving: boolean;
  submitting: boolean;
  currentSection: number;
  progressPercentage: number;
  currentQuestions: any[];
  groupedQuestions: any[][];
  isCompleted: boolean;
  isLastSection: boolean;
  handleResponseChange: (questionId: string, field: string, value: any) => void;
  handleSave: () => void;
  handleSubmit: () => void;
  goToNextSection: () => void;
  goToPreviousSection: () => void;
}

const FormContainer = ({
  template,
  assignment,
  questionResponses,
  formError,
  saving,
  submitting,
  currentSection,
  progressPercentage,
  currentQuestions,
  groupedQuestions,
  isCompleted,
  isLastSection,
  handleResponseChange,
  handleSave,
  handleSubmit,
  goToNextSection,
  goToPreviousSection
}: FormContainerProps) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AssessmentHeader 
        title={template.title}
        description={template.description}
        status={isCompleted ? 'Completed' : assignment.status}
        dueDate={assignment.dueDate}
        progressPercentage={progressPercentage}
      />
      
      <SectionNavigation
        currentSection={currentSection}
        totalSections={groupedQuestions.length}
        onPrevious={goToPreviousSection}
        onNext={goToNextSection}
      />
      
      <QuestionsList 
        currentQuestions={currentQuestions}
        questionResponses={questionResponses}
        currentSection={currentSection}
        handleResponseChange={handleResponseChange}
        isCompleted={isCompleted}
      />
      
      <FormError error={formError} />
      
      <FormActions 
        isCompleted={isCompleted}
        isLastSection={isLastSection}
        saving={saving}
        submitting={submitting}
        onSave={handleSave}
        onSubmit={handleSubmit}
        onNextSection={goToNextSection}
      />
    </div>
  );
};

export default FormContainer;
