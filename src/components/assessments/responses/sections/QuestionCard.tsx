
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AssessmentQuestion, QuestionResponse } from '@/types/assessment';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [fileError, setFileError] = useState<string | null>(null);

  const handleAnswer = (value: string) => {
    onChange(question.id, 'answer', value === 'yes');
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(question.id, 'comment', e.target.value);
  };

  // Allowed file types: PDF, DOC, DOCX, PNG, JPEG, JPG
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpeg', '.jpg'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES = 5;

  const isValidFileType = (file: File): boolean => {
    if (ALLOWED_FILE_TYPES.includes(file.type)) return true;
    const fileName = file.name.toLowerCase();
    return ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    // Clear previous error
    setFileError(null);
    const selectedFiles = Array.from(e.target.files);
    
    // Check total file count
    if (files.length + selectedFiles.length > MAX_FILES) {
      const errorMsg = `You can upload a maximum of ${MAX_FILES} files. You currently have ${files.length} file(s) uploaded.`;
      setFileError(errorMsg);
      toast.error(errorMsg);
      e.target.value = '';
      return;
    }

    const validFiles: any[] = [];
    const errors: string[] = [];
    
    for (const file of selectedFiles) {
      // Validate file type
      if (!isValidFileType(file)) {
        const errorMsg = `File "${file.name}" has an invalid format. Allowed formats: PDF, DOC, DOCX, PNG, JPEG, JPG.`;
        errors.push(errorMsg);
        toast.error(errorMsg);
        continue;
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const errorMsg = `File "${file.name}" exceeds the 10MB size limit. Maximum file size is 10MB.`;
        errors.push(errorMsg);
        toast.error(errorMsg);
        continue;
      }
      
      validFiles.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        file: file, // Store the File object for later upload
        uploadedAt: new Date().toISOString()
      });
    }
    
    // Show error if any files failed validation
    if (errors.length > 0) {
      setFileError(errors[0]); // Show first error
    }
    
    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onChange(question.id, 'attachments', updatedFiles);
      toast.success(`${validFiles.length} file(s) added successfully`);
      // Clear error if at least one file was successfully added and no errors
      if (errors.length === 0) {
        setFileError(null);
      }
    }
    
    e.target.value = '';
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
              {/* Error Message */}
              {fileError && (
                <Alert variant="destructive" className="mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{fileError}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-transparent"
                      onClick={() => setFileError(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
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
