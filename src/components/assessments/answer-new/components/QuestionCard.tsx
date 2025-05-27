
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface QuestionCardProps {
  question: any;
  answer: any;
  index: number;
  onAnswerChange: (questionId: string, field: string, value: any) => void;
}

const QuestionCard = ({ question, answer, index, onAnswerChange }: QuestionCardProps) => {
  const handleAnswerChange = (value: string) => {
    onAnswerChange(question.id, 'answer', value === 'yes');
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onAnswerChange(question.id, 'comment', e.target.value);
  };

  const getAnswerIcon = () => {
    if (answer?.answer === true) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (answer?.answer === false) return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertCircle className="h-5 w-5 text-gray-400" />;
  };

  const getCardBorderColor = () => {
    if (answer?.answer === true) return 'border-l-green-500 bg-green-50/30';
    if (answer?.answer === false) return 'border-l-red-500 bg-red-50/30';
    return 'border-l-blue-500 bg-blue-50/30';
  };

  return (
    <Card className={`border-l-4 transition-all duration-300 hover:shadow-lg ${getCardBorderColor()}`}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Question Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Badge 
                variant="outline" 
                className="bg-white/80 text-gray-700 font-medium text-sm px-3 py-1 mt-1"
              >
                Q{index}
              </Badge>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
                  {question.text}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getAnswerIcon()}
              {question.required && (
                <Badge variant="destructive">Required</Badge>
              )}
            </div>
          </div>
          
          {/* Answer Options */}
          <div className="ml-16">
            <div className="space-y-4">
              <RadioGroup
                value={answer?.answer === true ? 'yes' : answer?.answer === false ? 'no' : ''}
                onValueChange={handleAnswerChange}
                className="flex gap-8"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 transition-colors">
                  <RadioGroupItem value="yes" id={`${question.id}-yes`} className="border-green-500" />
                  <Label htmlFor={`${question.id}-yes`} className="cursor-pointer font-medium text-green-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Yes
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors">
                  <RadioGroupItem value="no" id={`${question.id}-no`} className="border-red-500" />
                  <Label htmlFor={`${question.id}-no`} className="cursor-pointer font-medium text-red-700">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      No
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              
              {/* Comments Section */}
              {question.allowComments && (
                <div className="mt-6 space-y-3">
                  <Label htmlFor={`comment-${question.id}`} className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Additional Comments {!question.required && '(Optional)'}
                  </Label>
                  <Textarea
                    id={`comment-${question.id}`}
                    value={answer?.comment || ''}
                    onChange={handleCommentChange}
                    placeholder="Provide additional context, explanations, or observations..."
                    className="min-h-[100px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
