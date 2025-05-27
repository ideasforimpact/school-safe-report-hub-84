
import React from 'react';
import QuestionCard from '../components/QuestionCard';
import { motion } from 'framer-motion';

interface Question {
  id: string;
  text: string;
  required?: boolean;
  allowComments?: boolean;
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Assessment Questions</h2>
        <p className="text-gray-600">Answer each question carefully. Required questions are marked with an asterisk (*)</p>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const answer = answers.find(a => a.questionId === question.id);
          
          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
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
    </div>
  );
};

export default AssessmentQuestionsContainer;
