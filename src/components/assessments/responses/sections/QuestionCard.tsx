
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AssessmentQuestion, QuestionResponse } from '@/types/assessment';
import { cn } from '@/lib/utils';
import QuestionHeader from '../question-items/QuestionHeader';
import AnswerRadioGroup from '../question-items/AnswerRadioGroup';
import CommentSection from '../question-items/CommentSection';
import FileAttachmentList from '../question-items/FileAttachmentList';
import FileUploadInput from '../question-items/FileUploadInput';
import { motion } from 'framer-motion';

interface QuestionCardProps {
  question: AssessmentQuestion;
  response?: QuestionResponse;
  index: number;
  onChange: (questionId: string, field: string, value: any) => void;
  isCompleted?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  response,
  index,
  onChange,
  isCompleted = false
}) => {
  const [showComments, setShowComments] = useState(!!response?.comment);
  const [files, setFiles] = useState<any[]>(response?.attachments || []);

  const handleAnswer = (value: string) => {
    onChange(question.id, 'answer', value === 'yes');
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(question.id, 'comment', e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      className="p-6"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <div className={cn(
        "border-l-4 p-5 bg-white rounded-lg transition-all",
        isAnswered 
          ? "border-l-green-500" 
          : question.required 
            ? "border-l-amber-400" 
            : "border-l-gray-200"
      )}>
        <QuestionHeader 
          index={index}
          text={question.text}
          required={question.required}
          isAnswered={isAnswered}
        />

        <div className="ml-8 space-y-5 mt-6">
          <AnswerRadioGroup
            questionId={question.id}
            answer={response?.answer}
            readOnly={isCompleted}
            onAnswerChange={handleAnswer}
          />

          {question.allowComments && (
            <div className="mt-4">
              <CommentSection
                questionId={question.id}
                showComments={showComments}
                comment={response?.comment}
                readOnly={isCompleted}
                onShowComments={() => setShowComments(true)}
                onCommentChange={handleCommentChange}
              />
            </div>
          )}

          {question.allowAttachments && (
            <div className="mt-4">
              <FileAttachmentList
                files={files}
                readOnly={isCompleted}
                onRemoveFile={removeFile}
              />
              
              <FileUploadInput
                questionId={question.id}
                readOnly={isCompleted}
                onFileUpload={handleFileUpload}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default QuestionCard;
