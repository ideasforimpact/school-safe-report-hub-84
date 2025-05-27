
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AssessmentAnswerFooterProps {
  onSubmit: () => void;
  onSaveAsDraft: () => void;
  submitting: boolean;
  saving: boolean;
  progress: number;
  totalQuestions: number;
  answeredQuestions: number;
}

const AssessmentAnswerFooter = ({ 
  onSubmit, 
  onSaveAsDraft,
  submitting, 
  saving,
  progress, 
  totalQuestions, 
  answeredQuestions 
}: AssessmentAnswerFooterProps) => {
  const navigate = useNavigate();
  const isComplete = progress === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="bg-white border-gray-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/assessments')}
              className="flex items-center gap-2 order-1 sm:order-none"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Assessments
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
                disabled={submitting || saving}
                className={`flex items-center gap-2 ${
                  isComplete 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            </div>
          </div>
          
          {!isComplete && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Complete all questions to submit ({answeredQuestions}/{totalQuestions} answered)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AssessmentAnswerFooter;
