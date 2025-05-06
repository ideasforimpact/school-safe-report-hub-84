
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const AssessmentsHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
      <div className="text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Assessments</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Create, manage, and review safety and compliance assessments
        </p>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          onClick={() => navigate('/assessments/templates/new')}
          className="whitespace-nowrap"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>
    </div>
  );
};

export default AssessmentsHeader;
