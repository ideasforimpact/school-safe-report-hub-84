
import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedSubmitButtonProps {
  isSubmitting: boolean;
}

const EnhancedSubmitButton: React.FC<EnhancedSubmitButtonProps> = ({ isSubmitting }) => {
  return (
    <div className="pt-4 flex justify-center">
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full md:w-auto px-8 py-6 text-lg rounded-full bg-gradient-to-r from-primary to-secondary-500 hover:from-primary-600 hover:to-secondary-600 transition-all shadow-md hover:shadow-lg"
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Submitting...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            <span>Submit Grievance</span>
          </div>
        )}
      </Button>
    </div>
  );
};

export default EnhancedSubmitButton;
