
import React from 'react';
import { LucideIcon } from 'lucide-react';
import AssessmentSummaryCards from '@/components/assessments/AssessmentSummaryCards';
import RecentAssessmentsTable from '@/components/assessments/RecentAssessmentsTable';
import AssessmentsTable from '@/components/assessments/AssessmentsTable';
import { useAssessmentAccess } from '@/hooks/assessments/useAssessmentAccess';
import { Badge } from '@/components/ui/badge';

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
  const { hasAssessmentAdmin } = useAssessmentAccess();

  return (
    <div className="space-y-6">
      {!hasAssessmentAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              Limited Access
            </Badge>
            <p className="text-blue-700 text-sm">
              You can only view assessments that you created or are assigned to you.
            </p>
          </div>
        </div>
      )}
      
      <AssessmentSummaryCards data={summaryData} />
      
      <div className="mt-6">
        <AssessmentsTable />
      </div>
    </div>
  );
};

export default OverviewTab;
