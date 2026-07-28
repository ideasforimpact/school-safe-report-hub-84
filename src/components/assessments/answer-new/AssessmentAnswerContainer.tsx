
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAssessmentAnswerData } from './hooks/useAssessmentAnswerData';
import AssessmentAnswerHeader from './sections/AssessmentAnswerHeader';
import AssessmentQuestionsContainer from './sections/AssessmentQuestionsContainer';
import AssessmentGeneralSubmission from './sections/AssessmentGeneralSubmission';
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
    generalComment,
    setGeneralComment,
    generalAttachments,
    setGeneralAttachments,
    loading,
    error,
    submitting,
    saving,
    progress,
    handleAnswerChange,
    handleSubmit,
    handleSaveAsDraft
  } = useAssessmentAnswerData(assessmentId);

  // Question cards are collapsed by default, so their answers aren't in the
  // DOM until expanded. window.print() blocks synchronously, so a React state
  // update triggered from the same click (or from a "beforeprint" listener)
  // isn't guaranteed to be painted before the browser captures the print
  // layout — expand everything, wait two animation frames for the paint to
  // actually land, then invoke print.
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    // Best-effort for native Ctrl+P / browser menu print (bypasses the button,
    // so there's no chance to await a paint first — this is a fallback, not
    // the reliable path).
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handlePrint = () => {
    setIsPrinting(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !assessment || !template) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 print:bg-white print:min-h-0"
    >
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <AssessmentAnswerHeader
          assessment={{ ...assessment, status: assessment.my_status ?? assessment.status }}
          template={template}
          progress={progress}
        />
        
        <AssessmentQuestionsContainer
          template={template}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          forceOpen={isPrinting}
        />

        <AssessmentGeneralSubmission
          generalComment={generalComment}
          onGeneralCommentChange={setGeneralComment}
          generalAttachments={generalAttachments}
          onGeneralAttachmentsChange={setGeneralAttachments}
        />

        <AssessmentAnswerFooter
          onSubmit={handleSubmit}
          onSaveAsDraft={handleSaveAsDraft}
          submitting={submitting}
          saving={saving}
          progress={progress}
          totalQuestions={template.questions?.length || 0}
          answeredQuestions={answers.filter(a => a.answer !== undefined).length}
          template={template}
          answers={answers}
          generalComment={generalComment}
          generalAttachments={generalAttachments}
          onPrint={handlePrint}
        />
      </div>
    </motion.div>
  );
};

export default AssessmentAnswerContainer;
