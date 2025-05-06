
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <motion.div 
      className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Button 
        variant="outline" 
        size="lg"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        className="flex items-center space-x-2 px-5"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Previous</span>
      </Button>
      
      <Button 
        variant="default" 
        size="lg"
        onClick={onNext}
        disabled={isLastQuestion}
        className="flex items-center space-x-2 px-5 bg-primary hover:bg-primary/90"
      >
        <span>Next</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
};

export default QuestionNavigation;
