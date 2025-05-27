
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AssessmentAnswerActionsProps {
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  canSubmit: boolean;
  progress: number;
}

const AssessmentAnswerActions = ({
  onSubmit,
  onBack,
  submitting,
  canSubmit,
  progress
}: AssessmentAnswerActionsProps) => {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {progress < 100 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Please answer all required questions before submitting the assessment.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </Button>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Progress: {progress}% complete
          </span>
          
          <Button
            onClick={onSubmit}
            disabled={submitting || !canSubmit}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            size="lg"
          >
            <CheckCircle className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentAnswerActions;
