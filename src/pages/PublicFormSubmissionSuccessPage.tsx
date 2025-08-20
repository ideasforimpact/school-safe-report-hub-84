
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';

const PublicFormSubmissionSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formId = searchParams.get('formId');
  const clientId = searchParams.get('clientId');

  const handleSubmitAnother = () => {
    if (formId && clientId) {
      // Go back to the form with the same parameters
      const formUrl = `/form/${formId}?clientId=${encodeURIComponent(clientId)}&formId=${encodeURIComponent(formId)}`;
      navigate(formUrl);
    } else {
      // Fallback to browser history
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Grievance submitted successfully!
              </CardTitle>
              <p className="text-lg text-gray-600">
                Thank you for your submission. Your grievance has been received and will be processed accordingly.
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="text-center">
            <Button 
              onClick={handleSubmitAnother}
              className="px-8 py-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Another Submission
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicFormSubmissionSuccessPage;
