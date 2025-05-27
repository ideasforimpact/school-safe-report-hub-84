
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  required?: boolean;
  allowComments?: boolean;
}

interface Answer {
  questionId: string;
  answer: boolean | undefined;
  comment?: string;
}

interface AssessmentQuestionsListProps {
  questions: Question[];
  answers: Answer[];
  onAnswerChange: (questionId: string, field: string, value: any) => void;
}

const AssessmentQuestionsList = ({ questions, answers, onAnswerChange }: AssessmentQuestionsListProps) => {
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
        <p className="text-gray-500">This assessment doesn't have any questions configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const answer = answers.find(a => a.questionId === question.id);
        
        const handleAnswerChange = (value: string) => {
          onAnswerChange(question.id, 'answer', value === 'yes');
        };

        const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          onAnswerChange(question.id, 'comment', e.target.value);
        };

        return (
          <Card key={question.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Question Header */}
                <div className="flex items-start gap-4">
                  <Badge variant="outline" className="mt-1 font-mono text-xs px-3 py-1">
                    Q{index + 1}
                  </Badge>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
                      {question.text}
                      {question.required && (
                        <span className="text-red-500 ml-2" title="Required">*</span>
                      )}
                    </h3>
                  </div>
                </div>

                {/* Answer Options */}
                <div className="ml-16">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Select your answer:
                      </Label>
                      <RadioGroup
                        value={answer?.answer === true ? 'yes' : answer?.answer === false ? 'no' : ''}
                        onValueChange={handleAnswerChange}
                        className="flex gap-8"
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem 
                            value="yes" 
                            id={`${question.id}-yes`}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <Label 
                            htmlFor={`${question.id}-yes`} 
                            className="cursor-pointer font-medium text-green-700 hover:text-green-800"
                          >
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem 
                            value="no" 
                            id={`${question.id}-no`}
                            className="text-red-600 focus:ring-red-500"
                          />
                          <Label 
                            htmlFor={`${question.id}-no`} 
                            className="cursor-pointer font-medium text-red-700 hover:text-red-800"
                          >
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Comments Section */}
                    {question.allowComments && (
                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <Label 
                            htmlFor={`comment-${question.id}`} 
                            className="text-sm font-medium text-gray-700"
                          >
                            Additional Comments (Optional)
                          </Label>
                        </div>
                        <Textarea
                          id={`comment-${question.id}`}
                          value={answer?.comment || ''}
                          onChange={handleCommentChange}
                          placeholder="Add any additional comments, observations, or notes about this question..."
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AssessmentQuestionsList;
