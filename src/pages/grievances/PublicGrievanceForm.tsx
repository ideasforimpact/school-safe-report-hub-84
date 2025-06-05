
import React, { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GrievanceProvider } from '@/contexts/grievances/GrievanceContext';
import GrievanceSubmissionForm from '@/components/grievances/GrievanceSubmissionForm';
import ShareOptions from '@/components/grievances/ShareOptions';
import { useNavigate } from 'react-router-dom';
import { isCaptchaVerified, requireCaptchaVerification } from '@/utils/captchaUtils';

const PublicGrievanceForm = () => {
  const navigate = useNavigate();
  const schoolName = "Safe School District"; // School name can be configured here or passed as a prop
  const formUrl = window.location.href;
  
  // Check CAPTCHA verification on component mount
  useEffect(() => {
    if (!isCaptchaVerified()) {
      // Redirect to CAPTCHA verification page
      navigate(requireCaptchaVerification(undefined, 'grievance'));
    }
  }, [navigate]);

  const handleBack = () => {
    navigate('/grievances');
  };

  // Don't render form if CAPTCHA is not verified
  if (!isCaptchaVerified()) {
    return null; // Component will redirect via useEffect
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <GrievanceProvider>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">{schoolName} - Grievance Form</h1>
          </div>
          
          <div className="mb-6">
            <ShareOptions formUrl={formUrl} onBack={handleBack} />
          </div>
          
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle>Submit Your Grievance</CardTitle>
              <CardDescription>
                Use this form to submit grievances regarding any school-related concerns. 
                All submissions are handled with the highest level of confidentiality.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <GrievanceSubmissionForm schoolName={schoolName} />
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>This form is for submitting grievances related to {schoolName}. Your information will be handled according to our privacy policy.</p>
          </div>
        </div>
      </GrievanceProvider>
    </div>
  );
};

export default PublicGrievanceForm;
