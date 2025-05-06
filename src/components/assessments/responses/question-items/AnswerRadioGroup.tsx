
import React from 'react';
import { Check, X } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface AnswerRadioGroupProps {
  questionId: string;
  answer?: boolean;
  readOnly: boolean;
  onAnswerChange: (value: string) => void;
}

const AnswerRadioGroup = ({ 
  questionId, 
  answer, 
  readOnly, 
  onAnswerChange 
}: AnswerRadioGroupProps) => {
  return (
    <ToggleGroup
      type="single"
      value={answer !== undefined ? (answer ? 'yes' : 'no') : undefined}
      onValueChange={onAnswerChange}
      disabled={readOnly}
      className="flex space-x-4 my-4"
    >
      <ToggleGroupItem 
        value="yes" 
        className={cn(
          "flex items-center justify-center w-32 h-12 rounded-lg text-base font-medium transition-all",
          answer === true 
            ? "bg-green-600 text-white hover:bg-green-700" 
            : "bg-white border-2 border-green-500 text-green-700 hover:bg-green-50"
        )}
        aria-label="Yes"
      >
        <Check className={cn("h-5 w-5 mr-2", answer === true ? "text-white" : "text-green-600")} />
        <span>Yes</span>
      </ToggleGroupItem>
      
      <ToggleGroupItem 
        value="no" 
        className={cn(
          "flex items-center justify-center w-32 h-12 rounded-lg text-base font-medium transition-all",
          answer === false 
            ? "bg-red-600 text-white hover:bg-red-700" 
            : "bg-white border-2 border-red-500 text-red-700 hover:bg-red-50"
        )}
        aria-label="No"
      >
        <X className={cn("h-5 w-5 mr-2", answer === false ? "text-white" : "text-red-600")} />
        <span>No</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default AnswerRadioGroup;
