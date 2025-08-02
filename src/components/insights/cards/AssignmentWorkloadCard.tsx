import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { AssignmentWorkload } from '@/hooks/useNewInsightsData';

interface AssignmentWorkloadCardProps {
  workload: AssignmentWorkload;
  onFilterApply: (filterType: string, value: string) => void;
}

const AssignmentWorkloadCard: React.FC<AssignmentWorkloadCardProps> = ({ workload, onFilterApply }) => {
  const topAssignee = workload.topAssignees[0];

  return (
    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white">Assignment & Workload</CardTitle>
        <Users className="h-4 w-4 text-white/80" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topAssignee ? (
            <>
              <div 
                className="cursor-pointer hover:bg-white/20 p-2 rounded transition-colors"
                onClick={() => onFilterApply('assignee', topAssignee.name)}
              >
                <div className="text-lg font-semibold text-white">{topAssignee.name}</div>
                <div className="text-sm text-white/80">
                  {topAssignee.openCount} open incidents
                </div>
                <div className="text-xs text-white/80">
                  Self: {topAssignee.selfAssigned} | Assigned: {topAssignee.assignedByOthers}
                </div>
              </div>
              
              <div className="space-y-1">
                {workload.topAssignees.slice(1, 3).map((assignee, index) => (
                  <div 
                    key={assignee.name}
                    className="flex justify-between items-center text-sm cursor-pointer hover:bg-white/10 p-1 rounded"
                    onClick={() => onFilterApply('assignee', assignee.name)}
                  >
                    <span className="truncate text-white">{assignee.name}</span>
                    <span className="text-white/80">{assignee.openCount}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-white/80">No assignment data available</div>
          )}
          
          <div className="text-xs text-white/80 pt-2 border-t border-white/20 space-y-1">
            <div>Total open: {workload.totalOpenIncidents}</div>
            <div>Self-assigned: {workload.selfAssignmentRate.toFixed(1)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentWorkloadCard;