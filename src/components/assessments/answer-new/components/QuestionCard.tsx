
import React, { useState } from 'react';
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
  const [attachments, setAttachments] = useState<FileItem[]>(answer?.attachments || []);

  const handleAnswerChange = (value: string) => {
    onAnswerChange(question.id, 'answer', value === 'yes');
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onAnswerChange(question.id, 'comment', e.target.value);
  };

  const handleAttachmentsChange = (files: FileItem[]) => {
    setAttachments(files);
    onAnswerChange(question.id, 'attachments', files);
  };

  const getAnswerIcon = () => {
    if (answer?.answer === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (answer?.answer === false) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  };

  const getCardBorderColor = () => {
    if (answer?.answer === true) return 'border-l-green-500';
    if (answer?.answer === false) return 'border-l-red-500';
    return 'border-l-blue-500';
  };

  const getStatusBadge = () => {
    if (answer?.answer === true) return <Badge className="bg-green-100 text-green-800">Answered: Yes</Badge>;
    if (answer?.answer === false) return <Badge className="bg-red-100 text-red-800">Answered: No</Badge>;
    return null;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`border-l-4 transition-all duration-300 ${getCardBorderColor()}`}>
        <CollapsibleTrigger asChild>
          <div className="w-full cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant="outline" className="bg-white/80 text-gray-700 font-medium text-sm px-3 py-1">
                    Q{index}
                  </Badge>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 leading-relaxed line-clamp-2">
                      {question.text}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getAnswerIcon()}
                  {getStatusBadge()}
                  {question.required && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                  {question.allowAttachments && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      Attachments
                    </Badge>
                  )}
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-6 px-6">
            <div className="ml-12 space-y-6">
              {/* Answer Options */}
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
              </div>

              {/* Comments Section */}
              {question.allowComments && (
                <div className="space-y-3">
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

              {/* File Attachments Section */}
              {question.allowAttachments && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    File Attachments {!question.required && '(Optional)'}
                  </Label>
                  <MultipleFilesUpload
                    onFilesChange={handleAttachmentsChange}
                    initialFiles={attachments}
                    maxFiles={5}
                    className="border-gray-200"
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
