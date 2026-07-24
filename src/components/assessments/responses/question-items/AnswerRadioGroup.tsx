
import React from 'react';
import { Check, X } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface AnswerRadioGroupProps {
  questionId: string;
  answer?: string;
  correctAnswer?: string;
  readOnly: boolean;
  onAnswerChange: (value: string) => void;
}

const AnswerRadioGroup = ({
  questionId,
  answer,
  correctAnswer = 'yes',
  readOnly,
  onAnswerChange
}: AnswerRadioGroupProps) => {
  const getOptionClassName = (optionValue: string) => {
    const isSelected = answer === optionValue;
    const isCorrect = optionValue === correctAnswer;

    if (!isSelected) {
      return "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50";
    }

    return isCorrect
      ? "bg-green-600 text-white hover:bg-green-700"
      : "bg-red-600 text-white hover:bg-red-700";
  };

  const getIconClassName = (optionValue: string) => {
    const isSelected = answer === optionValue;

    if (!isSelected) {
      return "text-gray-500";
    }

    return "text-white";
  };

  return (
    <ToggleGroup
      type="single"
      value={answer}
      onValueChange={onAnswerChange}
      disabled={readOnly}
      className="flex space-x-4 my-4"
    >
      <ToggleGroupItem
        value="yes"
        className={cn(
          "flex items-center justify-center w-32 h-12 rounded-lg text-base font-medium transition-all",
          getOptionClassName('yes')
        )}
        aria-label="Yes"
      >
        <Check className={cn("h-5 w-5 mr-2", getIconClassName('yes'))} />
        <span>Yes</span>
      </ToggleGroupItem>

      <ToggleGroupItem
        value="no"
        className={cn(
          "flex items-center justify-center w-32 h-12 rounded-lg text-base font-medium transition-all",
          getOptionClassName('no')
        )}
        aria-label="No"
      >
        <X className={cn("h-5 w-5 mr-2", getIconClassName('no'))} />
        <span>No</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default AnswerRadioGroup;
