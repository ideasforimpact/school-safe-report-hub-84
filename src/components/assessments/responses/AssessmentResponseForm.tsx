
import React from 'react';
import QuestionResponseItem from './QuestionResponseItem';
import AssessmentHeader from './header/AssessmentHeader';
import SectionNavigation from './navigation/SectionNavigation';
import FormActions from './actions/FormActions';
import FormError from './error/FormError';
import { useAssessmentResponseForm } from './hooks/useAssessmentResponseForm';

const AssessmentResponseForm = () => {
  const {
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
    goToPreviousSection,
    setCurrentSection
  } = useAssessmentResponseForm();

  if (!assignment || !template) {
    return null;
  }

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
      
      {/* Assessment Questions */}
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

export default AssessmentResponseForm;
