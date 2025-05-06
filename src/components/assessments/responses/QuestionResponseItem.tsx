
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Paperclip, X, Plus, File } from 'lucide-react';
import { AssessmentQuestion, QuestionResponse, FileAttachment } from '@/types/assessment';

interface QuestionResponseItemProps {
  question: AssessmentQuestion;
  response?: QuestionResponse;
  index: number;
  onChange: (questionId: string, field: string, value: any) => void;
  readOnly?: boolean;
}

const QuestionResponseItem: React.FC<QuestionResponseItemProps> = ({
  question,
  response,
  index,
  onChange,
  readOnly = false
}) => {
  const [files, setFiles] = useState<FileAttachment[]>(response?.attachments || []);
  const [showComments, setShowComments] = useState(!!response?.comment);

  const handleAnswer = (value: string) => {
    onChange(question.id, 'answer', value === 'yes');
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(question.id, 'comment', e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real app, you would handle file upload to a server
    // For now, we'll just create mock file attachments
    if (e.target.files) {
      const newFiles: FileAttachment[] = Array.from(e.target.files).map(file => ({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString()
      }));
      
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onChange(question.id, 'attachments', updatedFiles);
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    onChange(question.id, 'attachments', updatedFiles.length > 0 ? updatedFiles : null);
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start mb-3">
          <span className="flex justify-center items-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm mr-2 mt-0.5">
            {index + 1}
          </span>
          <div className="flex-1">
            <p className="font-medium">
              {question.text}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </p>
          </div>
        </div>

        <div className="ml-8">
          <RadioGroup
            value={response?.answer ? 'yes' : 'no'}
            onValueChange={handleAnswer}
            className="flex space-x-4 mb-3"
            disabled={readOnly}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id={`yes-${question.id}`} />
              <Label htmlFor={`yes-${question.id}`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`no-${question.id}`} />
              <Label htmlFor={`no-${question.id}`}>No</Label>
            </div>
          </RadioGroup>

          {question.allowComments && (
            <div className="mt-2">
              {showComments ? (
                <div className="space-y-2">
                  <Label htmlFor={`comment-${question.id}`} className="text-sm text-gray-600">
                    Comments:
                  </Label>
                  <Textarea
                    id={`comment-${question.id}`}
                    value={response?.comment || ''}
                    onChange={handleCommentChange}
                    placeholder="Add your comments here..."
                    className="h-20"
                    disabled={readOnly}
                  />
                </div>
              ) : !readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(true)}
                  className="text-gray-500 hover:text-gray-700 p-0 h-auto font-normal"
                >
                  + Add comment
                </Button>
              )}
            </div>
          )}

          {question.allowAttachments && (
            <div className="mt-3">
              {files.length > 0 && (
                <div className="mb-2">
                  <Label className="text-sm text-gray-600">Attachments:</Label>
                  <div className="space-y-2 mt-1">
                    {files.map(file => (
                      <div
                        key={file.id}
                        className="flex items-center bg-gray-50 border border-gray-200 rounded-md p-2"
                      >
                        <File className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm flex-1 truncate" title={file.name}>
                          {file.name}
                        </span>
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!readOnly && (
                <div className="mt-2">
                  <input
                    type="file"
                    id={`file-${question.id}`}
                    className="sr-only"
                    onChange={handleFileUpload}
                    multiple
                  />
                  <Label
                    htmlFor={`file-${question.id}`}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700 cursor-pointer"
                  >
                    <Paperclip className="h-4 w-4 mr-1" />
                    Attach files
                  </Label>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionResponseItem;
