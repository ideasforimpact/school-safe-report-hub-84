
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MessageSquare, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight, Paperclip } from 'lucide-react';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import { FileItem } from '@/types/fileTypes';

interface QuestionCardProps {
  question: any;
  answer: any;
  index: number;
  onAnswerChange: (questionId: string, field: string, value: any) => void;
}

const QuestionCard = ({ question, answer, index, onAnswerChange }: QuestionCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  console.log(`QuestionCard for question ${question.id}:`, { question, answer });

  const handleAnswerChange = (value: string) => {
    console.log(`Setting answer for question ${question.id} to:`, value === 'yes');
    // Ensure we're updating only this specific question
    if (value === 'yes' || value === 'no') {
      onAnswerChange(question.id, 'answer', value === 'yes');
    }
  };

  // Get the current value for this specific question only
  const getRadioValue = () => {
    if (!answer || answer.questionId !== question.id) {
      return '';
    }
    if (answer.answer === true) return 'yes';
    if (answer.answer === false) return 'no';
    return '';
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log(`Setting comment for question ${question.id} to:`, e.target.value);
    onAnswerChange(question.id, 'comment', e.target.value);
  };

  const handleAttachmentsChange = (files: FileItem[]) => {
    console.log(`Setting attachments for question ${question.id} to:`, files);
    onAnswerChange(question.id, 'attachments', files);
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

  const getStatusBadge = () => {
    if (answer?.answer === true) return <Badge className="bg-green-100 text-green-800 border-green-200">✓ Yes</Badge>;
    if (answer?.answer === false) return <Badge className="bg-red-100 text-red-800 border-red-200">✗ No</Badge>;
    return <Badge variant="outline" className="bg-gray-50 text-gray-600">Not Answered</Badge>;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`border-l-4 transition-all duration-200 hover:shadow-md ${getCardBorderColor()}`}>
        <CollapsibleTrigger asChild>
          <div className="w-full cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Badge variant="outline" className="bg-white/90 text-gray-700 font-semibold text-sm px-3 py-1 shrink-0">
                    Q{index}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 leading-relaxed pr-4">
                      {question.text}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {getAnswerIcon()}
                  {getStatusBadge()}
                  {question.required && (
                    <Badge variant="destructive" className="text-xs font-medium">Required</Badge>
                  )}
                  {question.allowAttachments && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200">
                      <Paperclip className="h-3 w-3" />
                      Files
                    </Badge>
                  )}
                  <div className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                    {isOpen ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-6 px-6">
            <div className="ml-16 space-y-6 border-l-2 border-gray-100 pl-6">
              {/* Answer Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Select your answer:</h4>
                <RadioGroup
                  key={`radio-group-${question.id}`}
                  value={getRadioValue()}
                  onValueChange={handleAnswerChange}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-green-200 hover:bg-green-50 transition-all duration-200 cursor-pointer">
                    <RadioGroupItem value="yes" id={`${question.id}-yes`} className="border-green-500 text-green-600" />
                    <Label htmlFor={`${question.id}-yes`} className="cursor-pointer font-medium text-green-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-red-200 hover:bg-red-50 transition-all duration-200 cursor-pointer">
                    <RadioGroupItem value="no" id={`${question.id}-no`} className="border-red-500 text-red-600" />
                    <Label htmlFor={`${question.id}-no`} className="cursor-pointer font-medium text-red-700 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Comments Section */}
              {question.allowComments && (
                <div className="space-y-3">
                  <Label htmlFor={`comment-${question.id}`} className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    Additional Comments {!question.required && '(Optional)'}
                  </Label>
                  <Textarea
                    id={`comment-${question.id}`}
                    value={answer?.comment || ''}
                    onChange={handleCommentChange}
                    placeholder="Provide additional context, explanations, or observations..."
                    className="min-h-[120px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
                    rows={5}
                  />
                </div>
              )}

              {/* File Attachments Section */}
              {question.allowAttachments && (
                <div className="space-y-4 p-4 bg-purple-50/50 rounded-lg border border-purple-200">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-purple-600" />
                    File Attachments {!question.required && '(Optional)'}
                  </Label>
                  <div className="text-xs text-gray-500 mb-2">
                    You can upload documents, images, or other files to support your answer.
                  </div>
                  <MultipleFilesUpload
                    onFilesChange={handleAttachmentsChange}
                    initialFiles={answer?.attachments || []}
                    maxFiles={5}
                    className="border-gray-200 bg-white"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default QuestionCard;
