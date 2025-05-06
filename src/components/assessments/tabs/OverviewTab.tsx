
import React from 'react';
import { LucideIcon } from 'lucide-react';
import AssessmentSummaryCards from '@/components/assessments/AssessmentSummaryCards';
import AssessmentCard from '@/components/assessments/AssessmentCard';
import RecentAssessmentsTable from '@/components/assessments/RecentAssessmentsTable';

interface OverviewTabProps {
  summaryData: {
    total: number;
    completed: number;
    pending: number;
    averageScore: number;
  };
  assessmentTypes: Array<{
    id: number;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    count: number;
    progress: number;
  }>;
  recentAssessments: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    date: string;
    score: number | null;
  }>;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  summaryData,
  assessmentTypes,
  recentAssessments,
}) => {
  return (
    <div className="space-y-6">
      <AssessmentSummaryCards data={summaryData} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {assessmentTypes.map(assessment => (
          <AssessmentCard key={assessment.id} assessment={assessment} />
        ))}
      </div>
      
      <div className="mt-6">
        <RecentAssessmentsTable assessments={recentAssessments} />
      </div>
    </div>
  );
};

export default OverviewTab;
