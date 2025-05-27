
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AssessmentAnswerFooterProps {
  onSubmit: () => void;
  submitting: boolean;
  progress: number;
  totalQuestions: number;
  answeredQuestions: number;
}

const AssessmentAnswerFooter = ({ 
  onSubmit, 
  submitting, 
  progress, 
  totalQuestions, 
  answeredQuestions 
}: AssessmentAnswerFooterProps) => {
  const navigate = useNavigate();
  const canSubmit = progress === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="sticky bottom-0 z-10"
    >
      <Card className="bg-white/95 backdrop-blur-sm border-t shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {/* Left Side - Back Button and Progress Info */}
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                onClick={() => navigate('/assessments')}
                className="flex items-center gap-2 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Assessments
              </Button>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">
                    {answeredQuestions} of {totalQuestions} questions answered
                  </span>
                </div>
                
                {!canSubmit && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      {totalQuestions - answeredQuestions} questions remaining
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Side - Submit Button */}
            <Button
              onClick={onSubmit}
              disabled={submitting || !canSubmit}
              size="lg"
              className={`flex items-center gap-2 px-8 py-3 text-base font-medium transition-all duration-200 ${
                canSubmit 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Assessment
                </>
              )}
            </Button>
          </div>
          
          {/* Progress indicator */}
          {!canSubmit && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Complete all required questions to submit your assessment
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AssessmentAnswerFooter;
