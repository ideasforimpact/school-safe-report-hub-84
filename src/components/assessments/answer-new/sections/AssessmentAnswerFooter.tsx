
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Printer, Save, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { FileItem } from '@/types/fileTypes';

interface AnswerEntry {
  questionId: string;
  answer: string | undefined;
}

interface FooterQuestion {
  id: string;
  required?: boolean;
}

interface TemplateWithQuestions {
  questions?: unknown;
}

interface AssessmentAnswerFooterProps {
  onSubmit: () => void;
  onSaveAsDraft: () => void;
  submitting: boolean;
  saving: boolean;
  progress: number;
  totalQuestions: number;
  answeredQuestions: number;
  template: TemplateWithQuestions | null;
  answers: AnswerEntry[];
  generalComment: string;
  generalAttachments: FileItem[];
  onPrint: () => void;
}

const AssessmentAnswerFooter = ({ 
  onSubmit, 
  onSaveAsDraft,
  submitting, 
  saving,
  progress, 
  totalQuestions, 
  answeredQuestions,
  template,
  answers,
  generalComment,
  generalAttachments,
  onPrint
}: AssessmentAnswerFooterProps) => {
  // Check if all required questions are answered
  const checkAllRequiredAnswered = () => {
    if (!template?.questions) return false;
    
    const questions = Array.isArray(template.questions)
      ? (template.questions as unknown as FooterQuestion[])
      : [];

    const requiredQuestions = questions.filter((q) => q.required);

    return requiredQuestions.every((requiredQ) => {
      const answer = answers.find(a => a.questionId === requiredQ.id);
      return answer?.answer !== undefined;
    });
  };

  const allRequiredAnswered = checkAllRequiredAnswered();
  const hasGeneralComment = generalComment.trim().length > 0;
  const hasGeneralAttachment = generalAttachments.length > 0;
  const canSubmit = allRequiredAnswered && hasGeneralComment && hasGeneralAttachment && !submitting && !saving;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="print:hidden"
    >
      <Card className="bg-white border-gray-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={onPrint}
              className="flex items-center gap-2 order-1 sm:order-none"
              disabled={submitting || saving}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3 order-2 sm:order-none">
              <Button
                variant="outline"
                onClick={onSaveAsDraft}
                disabled={saving || submitting}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save as Draft'}
              </Button>
              
              <Button
                onClick={onSubmit}
                disabled={!canSubmit}
                className={`flex items-center gap-2 ${
                  canSubmit
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {canSubmit ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            </div>
          </div>

          {/* {(!allRequiredAnswered || !hasGeneralComment || !hasGeneralAttachment) && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {!allRequiredAnswered && `Answer all required questions to submit (${answeredQuestions}/${totalQuestions} answered)`}
                  {allRequiredAnswered && !hasGeneralComment && 'A general comment is required to submit'}
                  {allRequiredAnswered && hasGeneralComment && !hasGeneralAttachment && 'A general attachment is required to submit'}
                </span>
              </div>
            </div>
          )} */}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AssessmentAnswerFooter;
