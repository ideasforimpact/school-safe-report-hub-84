
import React from 'react';
import { useAnswerAssessmentForm } from './hooks/useAnswerAssessmentForm';
import AnswerAssessmentHeader from './sections/AnswerAssessmentHeader';
import AnswerAssessmentQuestions from './sections/AnswerAssessmentQuestions';
import AnswerAssessmentActions from './sections/AnswerAssessmentActions';
import LoadingState from './sections/LoadingState';
import ErrorState from './sections/ErrorState';
import { motion } from 'framer-motion';

const AnswerAssessmentForm = () => {
  const {
    assessment,
    template,
    answers,
    loading,
    error,
    submitting,
    handleAnswerChange,
    handleSubmit,
    calculateProgress
  } = useAnswerAssessmentForm();

  if (loading) {
    return <LoadingState />;
  }

  if (error || !assessment || !template) {
    return <ErrorState error={error} />;
  }

  const progress = calculateProgress();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <AnswerAssessmentHeader 
        assessment={assessment}
        template={template}
        progress={progress}
      />
      
      <AnswerAssessmentQuestions 
        questions={template.questions || []}
        answers={answers}
        onAnswerChange={handleAnswerChange}
      />
      
      <AnswerAssessmentActions 
        onSubmit={handleSubmit}
        submitting={submitting}
        progress={progress}
      />
    </motion.div>
  );
};

export default AnswerAssessmentForm;
