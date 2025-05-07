
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { GrievanceProvider } from '@/contexts/grievances/GrievanceContext';
import GrievanceSubmissionForm from '@/components/grievances/GrievanceSubmissionForm';

const PublicGrievanceForm = () => {
  const { formId } = useParams<{ formId: string }>();
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <GrievanceProvider>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <MessageSquare className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">School Grievance Form</h1>
          </div>
          
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle>Submit Your Grievance</CardTitle>
              <CardDescription>
                Use this form to submit grievances regarding any school-related concerns. 
                All submissions are handled with confidentiality.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <GrievanceSubmissionForm formId={formId} />
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>This form is for submitting grievances related to the school. Your information will be handled according to our privacy policy.</p>
          </div>
        </div>
      </GrievanceProvider>
    </div>
  );
};

export default PublicGrievanceForm;
