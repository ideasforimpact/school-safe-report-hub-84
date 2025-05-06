
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface AssessmentHeaderProps {
  title: string;
  description: string;
  status: 'Completed' | 'Overdue' | 'Pending' | 'In Progress';
  dueDate: string;
  progressPercentage: number;
}

const AssessmentHeader = ({ 
  title, 
  description, 
  status, 
  dueDate, 
  progressPercentage 
}: AssessmentHeaderProps) => {
  const isCompleted = status === 'Completed';
  const isOverdue = status === 'Overdue';

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-gray-500">{description}</p>
      </div>
      
      <div className="flex flex-col items-end space-y-2">
        <Badge className={isCompleted ? "bg-green-100 text-green-800" : 
                          isOverdue ? "bg-red-100 text-red-800" : 
                          "bg-blue-100 text-blue-800"}>
          {isCompleted ? (
            <><CheckCircle className="h-3 w-3 mr-1" /> Completed</>
          ) : isOverdue ? (
            <><AlertCircle className="h-3 w-3 mr-1" /> Overdue</>
          ) : (
            <><Clock className="h-3 w-3 mr-1" /> Due {new Date(dueDate).toLocaleDateString()}</>
          )}
        </Badge>
        
        {!isCompleted && (
          <div className="w-full sm:w-36">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentHeader;
