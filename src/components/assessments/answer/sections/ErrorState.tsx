
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  error: string | null;
}

const ErrorState = ({ error }: ErrorStateProps) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Assessment</h2>
          <p className="text-gray-600 mb-4 text-center">
            {error || 'Failed to load the assessment. Please try again.'}
          </p>
          <Button onClick={() => navigate('/assessments')}>
            Back to Assessments
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorState;
