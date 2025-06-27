
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
        <h1 className="text-3xl md:text-4xl font-bold text-white">Assessments</h1>
        <p className="text-lg text-blue-100 mt-2">
          Create, manage, and review safety and compliance assessments
        </p>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          onClick={handleCreateAssessment}
          className="whitespace-nowrap bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-md"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Assessment
        </Button>
      </div>
    </div>
  );
};

export default AssessmentsHeader;
