import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, FileText, ArrowLeft } from 'lucide-react';

const FormSubmissionSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formTitle = searchParams.get('formTitle') || 'Form';
  const submissionId = searchParams.get('submissionId');
  const formId = searchParams.get('formId');
  const clientId = searchParams.get('clientId');

  const handleGoHome = () => {
    navigate('/');
  };

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
          
          <CardContent className="space-y-6">
            {/* Success Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <FileText className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-800">What happens next?</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Your grievance has been received and recorded</li>
                    <li>• Our team will review your grievance within 24-48 hours</li>
                    <li>• You will receive updates on the status of your grievance</li>
                    <li>• If you provided contact information, we may reach out for additional details</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submission Reference */}
            {submissionId && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Submission Reference</p>
                  <p className="font-mono text-sm bg-white px-3 py-2 rounded border">
                    {submissionId}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Please keep this reference number for future inquiries
                  </p>
                </div>
              </div>
            )}

            {/* Important Notes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Important Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• All grievances are treated with confidentiality</li>
                <li>• You can submit additional information if needed</li>
                <li>• For urgent matters, please contact the appropriate department directly</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleSubmitAnother}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Another Submission
              </Button>
              <Button 
                onClick={handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormSubmissionSuccessPage; 