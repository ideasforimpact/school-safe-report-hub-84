
import React from 'react';
import QuestionResponseItem from './QuestionResponseItem';
import AssessmentHeader from './header/AssessmentHeader';
import SectionNavigation from './navigation/SectionNavigation';
import FormActions from './actions/FormActions';
import FormError from './error/FormError';
import { useAssessmentResponseForm } from './hooks/useAssessmentResponseForm';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';

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
    goToPreviousSection,
    setCurrentSection
  } = useAssessmentResponseForm();

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 max-w-4xl mx-auto">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-600">Loading assessment...</p>
      </div>
    );
  }

  // Show error state if not found
  if (notFound) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
          <p className="text-gray-600 mb-4 text-center">
            The assessment you're looking for doesn't exist or you don't have permission to access it.
          </p>
          <p className="text-gray-500 text-sm">Redirecting to assignments list...</p>
        </CardContent>
      </Card>
    );
  }

  // Safety check to prevent rendering without data
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
