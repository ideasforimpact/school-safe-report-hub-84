import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, User, AlertCircle } from 'lucide-react';
import { AssignmentMetrics } from '@/utils/insights/businessMetrics';

interface AssignmentWorkloadCardProps {
  metrics: AssignmentMetrics;
  onEmployeeClick?: (employeeName: string) => void;
}

const AssignmentWorkloadCard: React.FC<AssignmentWorkloadCardProps> = ({ 
  metrics, 
  onEmployeeClick 
}) => {
  const getWorkloadLevel = (openCount: number) => {
    if (openCount >= 10) return { level: 'High', color: 'text-destructive' };
    if (openCount >= 5) return { level: 'Medium', color: 'text-warning' };
    return { level: 'Normal', color: 'text-success' };
  };

  const getSelfAssignmentColor = (ratio: number) => {
    if (ratio >= 70) return 'text-warning';
    if (ratio >= 50) return 'text-primary';
    return 'text-success';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Assignment & Workload</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="font-bold text-lg">{metrics.totalOpenIncidents}</div>
              <div className="text-xs text-muted-foreground">Open</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className={`font-bold text-lg ${getSelfAssignmentColor(metrics.selfAssignmentRatio)}`}>
                {metrics.selfAssignmentRatio.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Self-Assigned</div>
            </div>
          </div>

          {metrics.employeesWithMostOpen.length > 0 ? (
            <>
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>High Workload Employees:</span>
                </div>
                
                {metrics.employeesWithMostOpen.slice(0, 3).map((employee) => {
                  const workload = getWorkloadLevel(employee.openCount);
                  return (
                    <div 
                      key={employee.name}
                      className="flex justify-between items-center p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onEmployeeClick?.(employee.name)}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium truncate max-w-24">
                          {employee.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${workload.color}`}>
                          {employee.openCount}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          of {employee.totalAssigned}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Avg: {metrics.averageOpenPerEmployee.toFixed(1)} open per employee
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              No assignment data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentWorkloadCard;