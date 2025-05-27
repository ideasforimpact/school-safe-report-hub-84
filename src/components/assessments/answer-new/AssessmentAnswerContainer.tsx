
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAssessmentAnswerData } from './hooks/useAssessmentAnswerData';
import AssessmentAnswerHeader from './sections/AssessmentAnswerHeader';
import AssessmentQuestionsContainer from './sections/AssessmentQuestionsContainer';
import AssessmentAnswerFooter from './sections/AssessmentAnswerFooter';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import { motion } from 'framer-motion';

const AssessmentAnswerContainer = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const {
    assessment,
    template,
    answers,
    loading,
    error,
    submitting,
    progress,
    handleAnswerChange,
    handleSubmit
  } = useAssessmentAnswerData(assessmentId);

  if (loading) {
    return <LoadingSpinner />;
  }

  // if (error || !assessment || !template) {
  //   return <ErrorDisplay error={error} />;
  // }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"
    >
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <AssessmentAnswerHeader 
          assessment={assessment}
          template={template}
          progress={progress}
        />
        
        <AssessmentQuestionsContainer
          template={template}
          answers={answers}
          onAnswerChange={handleAnswerChange}
        />
        
        <AssessmentAnswerFooter
          onSubmit={handleSubmit}
          submitting={submitting}
          progress={progress}
          totalQuestions={template.questions?.length || 0}
          answeredQuestions={answers.filter(a => a.answer !== undefined).length}
        />
      </div>
    </motion.div>
  );
};

export default AssessmentAnswerContainer;
