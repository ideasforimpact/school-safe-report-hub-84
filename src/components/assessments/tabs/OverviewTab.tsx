
import React from 'react';
import { LucideIcon } from 'lucide-react';
import AssessmentSummaryCards from '@/components/assessments/AssessmentSummaryCards';
import RecentAssessmentsTable from '@/components/assessments/RecentAssessmentsTable';
import AssessmentsTable from '@/components/assessments/AssessmentsTable';

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
      
      <div className="mt-6">
        <AssessmentsTable />
      </div>
    </div>
  );
};

export default OverviewTab;
