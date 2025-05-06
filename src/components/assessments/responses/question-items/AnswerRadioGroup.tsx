
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
    <RadioGroup
      value={answer !== undefined ? (answer ? 'yes' : 'no') : undefined}
      onValueChange={onAnswerChange}
      className="flex space-x-6 my-2"
      disabled={readOnly}
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="yes" id={`yes-${questionId}`} />
        <Label 
          htmlFor={`yes-${questionId}`}
          className={answer ? "font-medium text-green-700" : ""}
        >
          Yes
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="no" id={`no-${questionId}`} />
        <Label 
          htmlFor={`no-${questionId}`}
          className={answer === false ? "font-medium text-red-700" : ""}
        >
          No
        </Label>
      </div>
    </RadioGroup>
  );
};

export default AnswerRadioGroup;
