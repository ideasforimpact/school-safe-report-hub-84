
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowLeft } from 'lucide-react';

interface AnswerAssessmentActionsProps {
  onSubmit: () => void;
  submitting: boolean;
  progress: number;
}

const AnswerAssessmentActions = ({ onSubmit, submitting, progress }: AnswerAssessmentActionsProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/assessments')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessments
          </Button>
          
          <Button
            onClick={onSubmit}
            disabled={submitting || progress < 100}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnswerAssessmentActions;
