
import React from 'react';
import { useAssessmentResponseForm } from './hooks/useAssessmentResponseForm';
import LoadingState from './sections/LoadingState';
import NotFoundState from './sections/NotFoundState';
import FormContainer from './sections/FormContainer';
import { motion } from 'framer-motion';

const AssessmentResponseForm = () => {
  const {
    template,
    assessment, // Changed from assignment to assessment
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
    loading,
    notFound,
    handleResponseChange,
    handleSave,
    handleSubmit,
    goToNextQuestion,
    goToPreviousQuestion
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
  if (!assessment || !template) {
    //console.log("Missing assessment or template data", { assessment, template });
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <FormContainer
        template={template}
        assessment={assessment}
        questionResponses={questionResponses}
        formError={formError}
        saving={saving}
        submitting={submitting}
        currentSection={currentSection}
        currentQuestionIndex={currentQuestionIndex}
        progressPercentage={progressPercentage}
        currentQuestions={currentQuestions}
        groupedQuestions={groupedQuestions}
        isCompleted={isCompleted}
        isLastQuestion={isLastQuestion}
        isFirstQuestion={isFirstQuestion}
        handleResponseChange={handleResponseChange}
        handleSave={handleSave}
        handleSubmit={handleSubmit}
        goToNextQuestion={goToNextQuestion}
        goToPreviousQuestion={goToPreviousQuestion}
      />
    </motion.div>
  );
};

export default AssessmentResponseForm;
