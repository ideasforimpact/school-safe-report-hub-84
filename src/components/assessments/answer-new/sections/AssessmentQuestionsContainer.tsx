
import React from 'react';
import QuestionCard from '../components/QuestionCard';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

  const answeredQuestions = answers.filter(a => a.answer !== undefined).length;
  const progressPercentage = questions.length > 0 ? (answeredQuestions / questions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Assessment Questions</h2>
        <p className="text-gray-600 mb-4">Click on each question to expand and provide your answer. Required questions are marked with an asterisk (*)</p>
        
        {/* Progress Section */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Progress</span>
            <Badge variant="outline">
              {answeredQuestions} of {questions.length} answered
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-gray-500">{Math.round(progressPercentage)}% complete</p>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          const answer = answers.find(a => a.questionId === question.id);
          
          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
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
          className="mt-8 p-4 bg-gray-50 rounded-lg text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-gray-600">
            {answeredQuestions === questions.length 
              ? "🎉 All questions answered! You can now submit your assessment."
              : `${questions.length - answeredQuestions} questions remaining to complete the assessment.`
            }
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default AssessmentQuestionsContainer;
