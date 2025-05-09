
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFeedback } from '@/contexts/feedback/FeedbackContext';
import { useAuth } from '@/contexts/auth/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { formatUserFullName } from '@/utils/userUtils';

const FormResponsePage = () => {
  const { responseId } = useParams<{ responseId: string }>();
  const navigate = useNavigate();
  const { getResponseById } = useFeedback();
  const { user } = useAuth();
  
  const response = responseId ? getResponseById(responseId) : null;
  
  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-2xl font-bold">Response not found</h1>
        <p className="mt-2 text-gray-600">The feedback response you're looking for doesn't exist or has been deleted.</p>
        <Button className="mt-4" onClick={() => navigate('/feedback/responses')}>
          Back to Responses
        </Button>
      </div>
    );
  }
  
  const submitterName = response.anonymousSubmission 
    ? "Anonymous User" 
    : user ? formatUserFullName(user) : response.submitterName || "Unknown User";

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate('/feedback/responses')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> 
          Back to Responses
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Feedback Response #{response.id.substring(response.id.length - 5)}</span>
            <span className="text-sm font-normal text-muted-foreground">
              Submitted on {formatDate(response.submittedAt)}
            </span>
          </CardTitle>
          <CardDescription>
            Submitted by {submitterName} for form "{response.formTitle}"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {response.answers.map((answer, index) => (
            <div key={index} className="border-b pb-4 last:border-0">
              <h3 className="font-medium text-gray-700">{answer.question}</h3>
              <p className="mt-1">{answer.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormResponsePage;
