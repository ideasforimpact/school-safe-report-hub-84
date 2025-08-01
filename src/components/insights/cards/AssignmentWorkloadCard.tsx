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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Assignment & Workload</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topAssignee ? (
            <>
              <div 
                className="cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                onClick={() => onFilterApply('assignee', topAssignee.name)}
              >
                <div className="text-lg font-semibold">{topAssignee.name}</div>
                <div className="text-sm text-muted-foreground">
                  {topAssignee.openCount} open incidents
                </div>
                <div className="text-xs text-muted-foreground">
                  Self: {topAssignee.selfAssigned} | Assigned: {topAssignee.assignedByOthers}
                </div>
              </div>
              
              <div className="space-y-1">
                {workload.topAssignees.slice(1, 3).map((assignee, index) => (
                  <div 
                    key={assignee.name}
                    className="flex justify-between items-center text-sm cursor-pointer hover:bg-muted/30 p-1 rounded"
                    onClick={() => onFilterApply('assignee', assignee.name)}
                  >
                    <span className="truncate">{assignee.name}</span>
                    <span className="text-muted-foreground">{assignee.openCount}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No assignment data available</div>
          )}
          
          <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
            <div>Total open: {workload.totalOpenIncidents}</div>
            <div>Self-assigned: {workload.selfAssignmentRate.toFixed(1)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentWorkloadCard;