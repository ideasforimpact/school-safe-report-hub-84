
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MessageSquare, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight, Paperclip, Eye, Download } from 'lucide-react';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import { FileItem } from '@/types/fileTypes';
import { AssessmentQuestion, QuestionFile } from '@/types/assessment';

interface QuestionAnswer {
  questionId: string;
  answer: boolean | undefined;
  comment?: string;
  attachments?: FileItem[];
}
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: AssessmentQuestion & { files?: QuestionFile[] };
  answer: QuestionAnswer | undefined;
  index: number;
  onAnswerChange: (questionId: string, field: string, value: boolean | string | FileItem[]) => void;
  forceOpen?: boolean;
}

const QuestionCard = ({ question, answer, index, onAnswerChange, forceOpen = false }: QuestionCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isExpanded = isOpen || forceOpen;

  console.log(`QuestionCard for question ${question.id}:`, { question, answer });

  const handleAnswerChange = (value: string) => {
    console.log(`Setting answer for question ${question.id} to:`, value);
    if (value === 'yes' || value === 'no') {
      onAnswerChange(question.id, 'answer', value);
    }
  };

  const getRadioValue = () => {
    if (!answer || answer.questionId !== question.id) {
      return '';
    }
    return answer.answer ?? '';
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log(`Setting comment for question ${question.id} to:`, e.target.value);
    onAnswerChange(question.id, 'comment', e.target.value);
  };

  const handleAttachmentsChange = (files: FileItem[]) => {
    console.log(`Setting attachments for question ${question.id} to:`, files);
    onAnswerChange(question.id, 'attachments', files);
  };

  const correctAnswer = question.correctAnswer ?? 'yes';
  const hasAnswer = answer?.answer !== undefined && answer?.answer !== '';
  const isCorrect = hasAnswer && answer.answer === correctAnswer;

  const getAnswerIcon = () => {
    if (isCorrect) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (hasAnswer) return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertCircle className="h-5 w-5 text-gray-400" />;
  };

  const getCardBorderColor = () => {
    if (isCorrect) return 'border-l-green-500 bg-green-50/30';
    if (hasAnswer) return 'border-l-red-500 bg-red-50/30';
    return 'border-l-blue-500 bg-blue-50/30';
  };

  const getStatusBadge = () => {
    if (isCorrect) return <Badge className="bg-green-100 text-green-800 border-green-200">Correct</Badge>;
    if (hasAnswer) return <Badge className="bg-red-100 text-red-800 border-red-200">Wrong</Badge>;
    return <Badge variant="outline" className="bg-gray-50 text-gray-600">Not Answered</Badge>;
  };

  const getOptionClassName = (optionValue: string) => {
    const isSelected = answer?.answer === optionValue;
    const selectedIsCorrect = optionValue === correctAnswer;

    if (!isSelected) {
      return 'border-gray-200 hover:bg-gray-50 text-gray-700';
    }

    return selectedIsCorrect
      ? 'border-green-500 bg-green-50 text-green-800'
      : 'border-red-500 bg-red-50 text-red-800';
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsOpen}>
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
                  <div className="p-1 rounded-full hover:bg-gray-100 transition-colors print:hidden">
                    {isExpanded ? (
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
                  <div className={cn("flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer", getOptionClassName('yes'))}>
                    <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                    <Label htmlFor={`${question.id}-yes`} className="cursor-pointer font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Yes
                    </Label>
                  </div>
                  <div className={cn("flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer", getOptionClassName('no'))}>
                    <RadioGroupItem value="no" id={`${question.id}-no`} />
                    <Label htmlFor={`${question.id}-no`} className="cursor-pointer font-medium flex items-center gap-2">
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
                  <TextareaWithVoice
                    id={`comment-${question.id}`}
                    value={answer?.comment || ''}
                    onChange={handleCommentChange}
                    placeholder="Provide additional context, explanations, or observations..."
                    className="min-h-[120px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
                    rows={5}
                  />
                </div>
              )}

              {/* Template Question Files Section - Files uploaded when creating the template */}
              {question.files && question.files.length > 0 && (
                <div className="space-y-3 p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-blue-600" />
                    Question Reference Files
                  </Label>
                  <div className="text-xs text-gray-500 mb-2">
                    Reference files provided with this question:
                  </div>
                  <div className="space-y-2">
                    {question.files.map((file: QuestionFile, fileIndex: number) => (
                      <div
                        key={file.id || fileIndex}
                        className="flex items-center justify-between bg-white border border-blue-200 rounded-md p-3"
                      >
                        <div className="flex items-center min-w-0 flex-1">
                          <Paperclip className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                              {file.name || `File ${fileIndex + 1}`}
                            </p>
                            {file.size && (
                              <p className="text-xs text-gray-500">
                                {file.size > 1024 * 1024 
                                  ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                                  : file.size > 1024
                                  ? `${(file.size / 1024).toFixed(2)} KB`
                                  : `${file.size} bytes`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {file.url && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(file.url, '_blank')}
                                className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="View file"
                              >
                                View
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = file.url;
                                  link.download = file.name || 'download';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Download file"
                              >
                                Download
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Attachments Section - User can upload files when answering */}
              {question.allowAttachments && (
                <div className="space-y-4 p-4 bg-purple-50/50 rounded-lg border border-purple-200">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-purple-600" />
                    Your File Attachments {!question.required && '(Optional)'}
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
