
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FormActionsProps {
  isCompleted: boolean;
  isLastSection: boolean;
  saving: boolean;
  submitting: boolean;
  onSave: () => void;
  onSubmit: () => void;
  onNextSection: () => void;
}

const FormActions = ({
  isCompleted,
  isLastSection,
  saving,
  submitting,
  onSave,
  onSubmit,
  onNextSection
}: FormActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate('/assessments/assignments')}
      >
        Back to Assignments
      </Button>
      
      <div className="flex space-x-3">
        {!isCompleted && (
          <>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSave} 
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Draft
            </Button>
            <Button 
              type="button" 
              onClick={onSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Submit
            </Button>
          </>
        )}
        
        {!isLastSection && (
          <Button 
            type="button"
            onClick={onNextSection}
          >
            Next Section
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default FormActions;
