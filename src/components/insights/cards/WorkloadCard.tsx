import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, AlertTriangle } from 'lucide-react';
import { WorkloadMetrics } from '@/utils/insights/advancedMetrics';

interface WorkloadCardProps {
  metrics: WorkloadMetrics;
}

const WorkloadCard: React.FC<WorkloadCardProps> = ({ metrics }) => {
  const isUnbalanced = metrics.maxWorkload > metrics.averageWorkload * 2;

  return (
    <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-medium">Team Workload</CardTitle>
          <div className="bg-purple-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
          </div>
        </div>
        <CardDescription>Average incidents per assignee</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl md:text-3xl font-semibold text-primary-700">
          {metrics.averageWorkload.toFixed(1)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-500">
            {metrics.totalAssignees} active assignees
          </span>
        </div>
        {isUnbalanced && (
          <div className="flex items-center gap-1 mt-1">
            <AlertTriangle className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-yellow-600">
              Workload imbalance detected
            </span>
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1">
          Max: {metrics.maxWorkload} incidents
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkloadCard;