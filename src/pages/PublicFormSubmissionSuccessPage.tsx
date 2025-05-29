
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PublicLayout from '@/components/layout/PublicLayout';

const PublicFormSubmissionSuccessPage = () => {
  return (
    <PublicLayout>
      <div className="container mx-auto py-12 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Form Submitted Successfully!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-gray-600 text-lg">
              Thank you for your submission. Your form has been received and will be processed accordingly.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                Your submission has been recorded with timestamp: {new Date().toLocaleString()}
              </p>
            </div>
            
            <div className="pt-4">
              <Button asChild className="gap-2">
                <Link to="/settings?tab=form-configuration">
                  <Settings className="h-4 w-4" />
                  Back to Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default PublicFormSubmissionSuccessPage;
