
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface QuestionNavigationProps {
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

const QuestionNavigation = ({
  isFirstQuestion,
  isLastQuestion,
  onPrevious,
  onNext
}: QuestionNavigationProps) => {
  return (
    <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
      <Button 
        variant="outline" 
        size="sm"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Previous</span>
      </Button>
      
      <Button 
        variant="default" 
        size="sm"
        onClick={onNext}
        disabled={isLastQuestion}
        className="flex items-center space-x-2"
      >
        <span>Next</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default QuestionNavigation;
