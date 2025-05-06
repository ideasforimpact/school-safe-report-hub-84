
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionHeaderProps {
  index: number;
  text: string;
  required: boolean;
  isAnswered: boolean;
}

const QuestionHeader = ({ index, text, required, isAnswered }: QuestionHeaderProps) => {
  return (
    <div className="flex items-start mb-3">
      <span className={cn(
        "flex justify-center items-center w-6 h-6 rounded-full text-sm mr-2 mt-0.5",
        isAnswered 
          ? "bg-green-100 text-green-700" 
          : "bg-gray-100 text-gray-600"
      )}>
        {isAnswered ? <Check className="h-3 w-3" /> : index + 1}
      </span>
      <div className="flex-1">
        <p className="font-medium">
          {text}
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
      </div>
    </div>
  );
};

export default QuestionHeader;
