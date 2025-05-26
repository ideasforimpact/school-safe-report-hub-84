
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText } from 'lucide-react';

interface AnswerAssessmentHeaderProps {
  assessment: any;
  template: any;
  progress: number;
}

const AnswerAssessmentHeader = ({ assessment, template, progress }: AnswerAssessmentHeaderProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{template.title}</h1>
            <p className="text-gray-600 mt-2">{template.description}</p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{template.questions?.length || 0} questions</span>
            </div>
            
            {assessment.target_completion_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Due: {new Date(assessment.target_completion_date).toLocaleDateString()}</span>
              </div>
            )}
            
            <Badge variant="outline">
              {assessment.status}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnswerAssessmentHeader;
