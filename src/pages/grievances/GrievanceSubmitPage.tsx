
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GrievanceProvider } from '@/contexts/grievances/GrievanceContext';
import PublicLayout from '@/components/layout/PublicLayout';
import EnhancedGrievanceForm from '@/components/grievances/EnhancedGrievanceForm';
import ShareOptions from '@/components/grievances/ShareOptions';
import { useNavigate } from 'react-router-dom';

const GrievanceSubmitPage = () => {
  const navigate = useNavigate();
  const schoolName = "Safe School District"; // School name can be configured here or passed as a prop
  const formUrl = window.location.href;
  
  const handleBack = () => {
    navigate('/grievances');
  };
  
  return (
    <PublicLayout>
      <GrievanceProvider>
        <div className="max-w-3xl mx-auto py-8 px-4 md:px-0">
          <div className="flex items-center justify-center mb-6">
            <MessageSquare className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary-500 bg-clip-text text-transparent">{schoolName} - Grievance Form</h1>
          </div>
          
          <div className="mb-6">
            <ShareOptions formUrl={formUrl} onBack={handleBack} />
          </div>
          
          <Card className="shadow-md border-t-4 border-t-primary transition-all hover:shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary-50 to-transparent">
              <CardTitle className="text-xl md:text-2xl">Submit Your Grievance</CardTitle>
              <CardDescription className="text-gray-600">
                Use this form to submit grievances regarding any school-related concerns. 
                All submissions are handled with the highest level of confidentiality.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <EnhancedGrievanceForm schoolName={schoolName} />
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>This form is for submitting grievances related to {schoolName}. Your information will be handled according to our privacy policy.</p>
          </div>
        </div>
      </GrievanceProvider>
    </PublicLayout>
  );
};

export default GrievanceSubmitPage;
