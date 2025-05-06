
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface FormActionsProps {
  isCompleted: boolean;
  isLastQuestion: boolean;
  saving: boolean;
  submitting: boolean;
  onSave: () => void;
  onSubmit: () => void;
  onNextQuestion: () => void;
}

const FormActions = ({
  isCompleted,
  isLastQuestion,
  saving,
  submitting,
  onSave,
  onSubmit,
  onNextQuestion
}: FormActionsProps) => {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="pt-4 border-t border-gray-200 flex justify-between items-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => navigate('/assessments/assignments')}
        className="px-5"
      >
        Back to Assignments
      </Button>
      
      <div className="flex space-x-3">
        {!isCompleted && (
          <>
            <Button 
              type="button" 
              variant="outline" 
              size="lg"
              onClick={onSave} 
              disabled={saving}
              className="px-5"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button 
              type="button" 
              size="lg"
              onClick={onSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white px-5"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          </>
        )}
        
        {!isLastQuestion && !isCompleted && (
          <Button 
            type="button"
            size="lg"
            onClick={onNextQuestion}
            className="bg-primary hover:bg-primary/90 px-5"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default FormActions;
