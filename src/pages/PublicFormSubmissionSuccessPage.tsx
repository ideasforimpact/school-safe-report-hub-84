
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';

const PublicFormSubmissionSuccessPage = () => {
  const navigate = useNavigate();

  const handleBackToSettings = () => {
    navigate('/settings?tab=form');
  };

  return (
    <PublicLayout>
      <div className="container mx-auto py-6 max-w-3xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                Form Submitted Successfully!
              </CardTitle>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Thank you for your submission. Your form has been received and will be processed accordingly.
              </p>
              <Button 
                onClick={handleBackToSettings}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Back to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default PublicFormSubmissionSuccessPage;
