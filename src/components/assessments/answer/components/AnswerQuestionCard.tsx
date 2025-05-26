
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface AnswerQuestionCardProps {
  question: any;
  answer: any;
  index: number;
  onAnswerChange: (questionId: string, field: string, value: any) => void;
}

const AnswerQuestionCard = ({ question, answer, index, onAnswerChange }: AnswerQuestionCardProps) => {
  const handleAnswerChange = (value: string) => {
    onAnswerChange(question.id, 'answer', value === 'yes');
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onAnswerChange(question.id, 'comment', e.target.value);
  };

  console.log(`Rendering question card ${index}:`, question);
  console.log(`Current answer:`, answer);

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1 min-w-fit">
              Q{index}
            </Badge>
            <div className="flex-1">
              <h3 className="font-medium text-lg leading-relaxed">
                {question.text}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </h3>
            </div>
          </div>
          
          <div className="ml-11">
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Please select your answer:
              </Label>
              <RadioGroup
                value={answer?.answer === true ? 'yes' : answer?.answer === false ? 'no' : ''}
                onValueChange={handleAnswerChange}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                  <Label htmlFor={`${question.id}-yes`} className="cursor-pointer font-medium">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id={`${question.id}-no`} />
                  <Label htmlFor={`${question.id}-no`} className="cursor-pointer font-medium">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {question.allowComments && (
              <div className="mt-4">
                <Label htmlFor={`comment-${question.id}`} className="text-sm font-medium text-gray-700 mb-2 block">
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  id={`comment-${question.id}`}
                  value={answer?.comment || ''}
                  onChange={handleCommentChange}
                  placeholder="Add any additional comments, observations, or notes..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnswerQuestionCard;
