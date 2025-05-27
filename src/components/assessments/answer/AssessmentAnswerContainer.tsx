
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAssessmentAnswerData } from './hooks/useAssessmentAnswerData';
import AssessmentQuestionsList from './components/AssessmentQuestionsList';
import AssessmentAnswerActions from './components/AssessmentAnswerActions';
import LoadingState from './sections/LoadingState';
import ErrorState from './sections/ErrorState';

const AssessmentAnswerContainer = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  
  const {
    assessment,
    template,
    answers,
    loading,
    error,
    submitting,
    progress,
    handleAnswerChange,
    handleSubmit,
    canSubmit
  } = useAssessmentAnswerData(assessmentId);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !assessment || !template) {
    return <ErrorState error={error} />;
  }

  const questions = Array.isArray(template.questions) 
    ? (template.questions as any[])
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/assessments')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Assessments
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">{template.title}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {assessment.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assessment Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{template.title}</span>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {assessment.target_completion_date && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Due: {new Date(assessment.target_completion_date).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{questions.length} questions</span>
                </div>
              </div>
            </CardTitle>
            {template.description && (
              <p className="text-gray-600 mt-2">{template.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-gray-500">{progress}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Assessment Questions</h2>
            <div className="text-sm text-gray-500">
              Answer all questions below. Required questions are marked with *
            </div>
          </div>

          <AssessmentQuestionsList
            questions={questions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        </div>

        {/* Actions */}
        <div className="mt-8 sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4">
          <AssessmentAnswerActions
            onSubmit={handleSubmit}
            submitting={submitting}
            canSubmit={canSubmit}
            progress={progress}
            onBack={() => navigate('/assessments')}
          />
        </div>
      </div>
    </div>
  );
};

export default AssessmentAnswerContainer;
