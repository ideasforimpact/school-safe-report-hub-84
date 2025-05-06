
import React from 'react';
import { useAssessmentResponseForm } from './hooks/useAssessmentResponseForm';
import LoadingState from './sections/LoadingState';
import NotFoundState from './sections/NotFoundState';
import FormContainer from './sections/FormContainer';

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
    loading,
    notFound,
    handleResponseChange,
    handleSave,
    handleSubmit,
    goToNextSection,
    goToPreviousSection
  } = useAssessmentResponseForm();

  // Show loading state
  if (loading) {
    return <LoadingState />;
  }

  // Show error state if not found
  if (notFound) {
    return <NotFoundState />;
  }

  // Safety check to prevent rendering without data
  if (!assignment || !template) {
    return null;
  }

  return (
    <FormContainer
      template={template}
      assignment={assignment}
      questionResponses={questionResponses}
      formError={formError}
      saving={saving}
      submitting={submitting}
      currentSection={currentSection}
      progressPercentage={progressPercentage}
      currentQuestions={currentQuestions}
      groupedQuestions={groupedQuestions}
      isCompleted={isCompleted}
      isLastSection={isLastSection}
      handleResponseChange={handleResponseChange}
      handleSave={handleSave}
      handleSubmit={handleSubmit}
      goToNextSection={goToNextSection}
      goToPreviousSection={goToPreviousSection}
    />
  );
};

export default AssessmentResponseForm;
