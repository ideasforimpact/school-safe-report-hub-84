
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Clock, User, Target, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface AssessmentAnswerHeaderProps {
  assessment: any;
  template: any;
  progress: number;
}

const AssessmentAnswerHeader = ({ assessment, template, progress }: AssessmentAnswerHeaderProps) => {
  const navigate = useNavigate();

  const handleBackToAssessments = () => {
    navigate('/assessments');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Back Button */}
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={handleBackToAssessments}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </Button>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Title and Status */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {template.title}
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                  {template.description || 'Complete this assessment by answering all questions below.'}
                </p>
              </div>
              <Badge 
                variant="outline" 
                className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 text-sm font-medium"
              >
                {assessment.status}
              </Badge>
            </div>

            {/* Assessment Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Questions</p>
                  <p className="font-semibold text-gray-900">{template.questions?.length || 0}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold text-gray-900">{template.type || 'Assessment'}</p>
                </div>
              </div>

              {assessment.target_completion_date && (
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(assessment.target_completion_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="font-semibold text-gray-900">{progress}%</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Assessment Progress</span>
                <span className="text-sm text-gray-500">{progress}% Complete</span>
              </div>
              <Progress 
                value={progress} 
                className="h-3 bg-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AssessmentAnswerHeader;
