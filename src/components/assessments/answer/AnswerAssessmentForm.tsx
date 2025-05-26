
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
    ? (template.questions as unknown as Question[])
    : [];

  console.log('Assessment data:', assessment);
  console.log('Template data:', template);
  console.log('Questions to display:', questions);
  console.log('Current answers:', answers);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-6 p-6"
    >
      <AnswerAssessmentHeader 
        assessment={assessment}
        template={template}
        progress={progress}
      />
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Assessment Questions</h2>
        <p className="text-gray-600 mb-6">
          Please answer all questions below. Questions marked with * are required.
        </p>
        
        <AnswerAssessmentQuestions 
          questions={questions}
          answers={answers}
          onAnswerChange={handleAnswerChange}
        />
      </div>
      
      <AnswerAssessmentActions 
        onSubmit={handleSubmit}
        submitting={submitting}
        progress={progress}
      />
    </motion.div>
  );
};

export default AnswerAssessmentForm;
