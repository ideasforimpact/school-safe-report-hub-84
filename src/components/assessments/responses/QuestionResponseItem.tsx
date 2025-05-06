
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AssessmentQuestion, QuestionResponse, FileAttachment } from '@/types/assessment';
import { cn } from '@/lib/utils';
import QuestionHeader from './question-items/QuestionHeader';
import AnswerRadioGroup from './question-items/AnswerRadioGroup';
import CommentSection from './question-items/CommentSection';
import FileAttachmentList from './question-items/FileAttachmentList';
import FileUploadInput from './question-items/FileUploadInput';

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

  const isAnswered = response?.answer !== undefined;

  return (
    <Card className={cn(
      "shadow-sm border-l-4 transition-all",
      isAnswered 
        ? "border-l-green-500" 
        : question.required 
          ? "border-l-amber-400" 
          : "border-l-gray-200"
    )}>
      <CardContent className="p-4">
        <QuestionHeader 
          index={index}
          text={question.text}
          required={question.required}
          isAnswered={isAnswered}
        />

        <div className="ml-8 space-y-3">
          <AnswerRadioGroup
            questionId={question.id}
            answer={response?.answer}
            readOnly={readOnly}
            onAnswerChange={handleAnswer}
          />

          {question.allowComments && (
            <div className="mt-2">
              <CommentSection
                questionId={question.id}
                showComments={showComments}
                comment={response?.comment}
                readOnly={readOnly}
                onShowComments={() => setShowComments(true)}
                onCommentChange={handleCommentChange}
              />
            </div>
          )}

          {question.allowAttachments && (
            <div className="mt-3">
              <FileAttachmentList
                files={files}
                readOnly={readOnly}
                onRemoveFile={removeFile}
              />
              
              <FileUploadInput
                questionId={question.id}
                readOnly={readOnly}
                onFileUpload={handleFileUpload}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionResponseItem;
