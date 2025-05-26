
import React from 'react';
import { useAnswerAssessmentForm } from './hooks/useAnswerAssessmentForm';
import AnswerAssessmentHeader from './sections/AnswerAssessmentHeader';
import AnswerAssessmentQuestions from './sections/AnswerAssessmentQuestions';
import AnswerAssessmentActions from './sections/AnswerAssessmentActions';
import LoadingState from './sections/LoadingState';
import ErrorState from './sections/ErrorState';
import { motion } from 'framer-motion';

interface Question {
  id: string;
  text: string;
  required?: boolean;
  allowComments?: boolean;
}

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
  
  // Parse questions from JSONB
  const questions = Array.isArray(template.questions) 
    ? template.questions as Question[]
    : [];

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
        questions={questions}
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
