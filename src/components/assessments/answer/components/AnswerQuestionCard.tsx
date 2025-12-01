
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Paperclip, Eye, Download } from 'lucide-react';

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

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">
              {index}
            </Badge>
            <div className="flex-1">
              <h3 className="font-medium text-lg leading-relaxed">
                {question.text}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </h3>
            </div>
          </div>
          
          <div className="ml-11">
            <RadioGroup
              value={answer?.answer === true ? 'yes' : answer?.answer === false ? 'no' : ''}
              onValueChange={handleAnswerChange}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                <Label htmlFor={`${question.id}-yes`} className="cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`${question.id}-no`} />
                <Label htmlFor={`${question.id}-no`} className="cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
            
            {question.allowComments && (
              <div className="mt-4">
                <Label htmlFor={`comment-${question.id}`} className="text-sm text-gray-600">
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  id={`comment-${question.id}`}
                  value={answer?.comment || ''}
                  onChange={handleCommentChange}
                  placeholder="Add any additional comments or notes..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            )}

            {/* Template Question Files Section - Files uploaded when creating the template */}
            {question.files && question.files.length > 0 && (
              <div className="mt-4 space-y-3 p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-blue-600" />
                  Question Reference Files
                </Label>
                <div className="text-xs text-gray-500 mb-2">
                  Reference files provided with this question:
                </div>
                <div className="space-y-2">
                  {question.files.map((file: any, fileIndex: number) => (
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
                              <Eye className="h-4 w-4 mr-1" />
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
                              <Download className="h-4 w-4 mr-1" />
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnswerQuestionCard;
