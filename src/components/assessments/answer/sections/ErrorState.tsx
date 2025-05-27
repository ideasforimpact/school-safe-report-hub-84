
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ErrorStateProps {
  error?: string | null;
}

const ErrorState = ({ error }: ErrorStateProps) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Assessment</h3>
          <p className="text-gray-600 text-center mb-6">
            {error || 'There was an error loading the assessment. Please try again.'}
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
