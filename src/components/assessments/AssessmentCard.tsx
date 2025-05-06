
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AssessmentCardProps {
  assessment: {
    id: number;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    count: number;
    progress: number;
  };
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({ assessment }) => {
  const { title, description, icon: Icon, color, bgColor, count, progress } = assessment;
  
  return (
    <Card className="border-none shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-medium">{title}</CardTitle>
          <div className={`${bgColor} h-10 w-10 rounded-full flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{count} assessments</span>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentCard;
