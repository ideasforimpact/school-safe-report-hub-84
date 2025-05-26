
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const NotFoundState = () => {
  const navigate = useNavigate();
  const { assessmentId } = useParams<{ assessmentId: string }>();

  useEffect(() => {
    const timer = setTimeout(() => {
      toast.error("Assessment not found");
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="flex flex-col items-center justify-center p-8">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
        <p className="text-gray-600 mb-4 text-center">
          The assessment with ID "{assessmentId}" doesn't exist or you don't have permission to access it.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          This could be because:
        </p>
        <ul className="text-sm text-gray-600 mb-6 list-disc pl-6 self-start">
          <li>The assessment has been deleted</li>
          <li>The URL is incorrect</li>
          <li>You don't have permission to view this assessment</li>
        </ul>
        <Button 
          onClick={() => navigate('/assessments')} 
          className="mt-2"
        >
          Go to Assessments List
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotFoundState;
