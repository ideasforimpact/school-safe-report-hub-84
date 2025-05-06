
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const NotFoundState = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      toast.error("Assessment not found");
      navigate('/assessments/assignments');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="flex flex-col items-center justify-center p-8">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
        <p className="text-gray-600 mb-4 text-center">
          The assessment you're looking for doesn't exist or you don't have permission to access it.
        </p>
        <p className="text-gray-500 text-sm">Redirecting to assignments list...</p>
      </CardContent>
    </Card>
  );
};

export default NotFoundState;
