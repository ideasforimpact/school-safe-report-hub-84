
import React from 'react';
import QuestionCard from '../components/QuestionCard';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  required?: boolean;
  allowComments?: boolean;
  allowAttachments?: boolean;
}

interface AssessmentQuestionsContainerProps {
  template: any;
  answers: any[];
  onAnswerChange: (questionId: string, field: string, value: any) => void;
}

const AssessmentQuestionsContainer = ({ template, answers, onAnswerChange }: AssessmentQuestionsContainerProps) => {
  const questions = Array.isArray(template.questions) 
    ? (template.questions as unknown as Question[])
    : [];

  // Debug logging to verify questions structure
  console.log('[Container] Template questions:', questions);
  console.log('[Container] Questions count:', questions.length);
  if (questions.length > 0) {
    console.log('[Container] First question:', { id: questions[0]?.id, text: questions[0]?.text?.substring(0, 50) });
  }

  const answeredQuestions = answers.filter(a => a.answer !== undefined).length;
  const progressPercentage = questions.length > 0 ? (answeredQuestions / questions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Assessment Questions</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Click on each question card below to expand and provide your answer. Questions marked with an asterisk (*) are required.
        </p>
        
        {/* Progress Section */}
        <Card className="max-w-md mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <Badge variant="outline" className="bg-white/80">
                  {answeredQuestions} of {questions.length} answered
                </Badge>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{Math.round(progressPercentage)}% complete</span>
                {progressPercentage === 100 ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Ready to submit!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{questions.length - answeredQuestions} remaining</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Instructions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">How to use this assessment:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Click on any question card to expand it</li>
                  <li>• Answer with Yes or No using the radio buttons</li>
                  <li>• Add comments when available to provide additional context</li>
                  <li>• Upload files if the question supports attachments</li>
                  <li>• Complete all required questions before submitting</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          // Validate question has an id
          if (!question || !question.id) {
            console.error(`[Container] ERROR: Question at index ${index} is missing id!`, question);
            return null;
          }
          
          // Find the answer for this specific question
          const answer = answers.find(a => a && a.questionId === question.id);
          
          // Debug logging to verify answer lookup
          console.log(`[Container] Question ${question.id} (index ${index}) got answer:`, answer ? `answer=${answer.answer}, questionId=${answer.questionId}` : 'undefined');
          
          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + (index * 0.1) }}
            >
              <QuestionCard
                question={question}
                answer={answer}
                index={index + 1}
                onAnswerChange={onAnswerChange}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Summary at the bottom */}
      {questions.length > 0 && (
        <motion.div 
          className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg text-center border border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {answeredQuestions === questions.length ? (
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">
                🎉 All questions answered! You can now submit your assessment.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <p>
                {questions.length - answeredQuestions} questions remaining to complete the assessment.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AssessmentQuestionsContainer;
