import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ClipboardCheck } from 'lucide-react';

interface AssessmentsHeaderProps {
  onCreateAssessment: () => void;
  totalCount: number;
  openCount: number;
  submittedCount: number;
  closedCount: number;
}

const AssessmentsHeader: React.FC<AssessmentsHeaderProps> = ({
  onCreateAssessment,
  totalCount,
  openCount,
  submittedCount,
  closedCount,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Top row (icon + title + button) */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Assessments
            </h1>
            <p className="text-sm text-gray-500">
              Create, manage, and review safety and compliance assessments
            </p>
          </div>
        </div>

        <Button
          onClick={onCreateAssessment}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Create Assessment
        </Button>
      </div>

      {/* Stats row (same spacing as Employee page) */}
      <div className="flex gap-80">
        <div className="ms-16">
          <p className="text-sm text-gray-500">Total Assessments</p>
          <p className="text-3xl font-semibold text-gray-900">
            {totalCount}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Open</p>
          <p className="text-3xl font-semibold text-orange-500">
            {openCount}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Submitted</p>
          <p className="text-3xl font-semibold text-purple-600">
            {submittedCount}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Closed</p>
          <p className="text-3xl font-semibold text-green-600">
            {closedCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssessmentsHeader;
