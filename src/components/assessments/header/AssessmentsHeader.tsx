
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface AssessmentsHeaderProps {
  onCreateTemplate?: () => void;
}

const AssessmentsHeader: React.FC<AssessmentsHeaderProps> = ({ onCreateTemplate }) => {
  const location = useLocation();

  const handleCreateAssessment = () => {
    console.log("Create assessment button clicked");
    if (onCreateTemplate) {
      onCreateTemplate();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
      <div className="text-left">
        <h1 className="text-2xl font-bold">Assessments</h1>
        <p className="text-gray-600 mt-1">
          Create, manage, and review safety and compliance assessments
        </p>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          onClick={handleCreateAssessment}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Create Assessment
        </Button>
      </div>
    </div>
  );
};

export default AssessmentsHeader;
