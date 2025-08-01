import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, AlertTriangle } from 'lucide-react';
import { WorkloadMetrics } from '@/utils/insights/advancedMetrics';

interface WorkloadCardProps {
  metrics: WorkloadMetrics;
}

const WorkloadCard: React.FC<WorkloadCardProps> = ({ metrics }) => {
  const isUnbalanced = metrics.teamBalance === 'unbalanced';
  
  const getBalanceColor = (balance: string) => {
    return balance === 'balanced' ? 'text-success' : 'text-warning';
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-success';
    if (utilization >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getIconColor = (balance: string) => {
    return balance === 'balanced' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning';
  };

  return (
    <Card className="border-none shadow-elegant hover:shadow-card-hover transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-semibold">Team Workload Balance</CardTitle>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center ${getIconColor(metrics.teamBalance)}`}>
            <Users className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        </div>
        <CardDescription>Distribution and efficiency of team assignments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl md:text-3xl font-bold text-primary">
            {metrics.averageWorkload.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">avg per person</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Team:</span>
            <span className="font-medium">{metrics.totalAssignees}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Max:</span>
            <span className="font-medium">{metrics.maxWorkload}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 bg-primary/5 rounded-md">
          <span className="text-xs text-muted-foreground">Capacity Utilization:</span>
          <span className={`text-xs font-medium ${getUtilizationColor(metrics.capacityUtilization)}`}>
            {metrics.capacityUtilization.toFixed(1)}%
          </span>
        </div>

        {isUnbalanced && (
          <div className="flex items-center gap-1 p-2 bg-warning/5 rounded-md">
            <AlertTriangle className="h-3 w-3 text-warning" />
            <span className="text-xs text-warning font-medium">
              Workload imbalance detected - consider redistributing
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <span className="text-muted-foreground">Team Balance:</span>
          <span className={`font-medium ${getBalanceColor(metrics.teamBalance)}`}>
            {metrics.teamBalance === 'balanced' ? 'Well Balanced' : 'Needs Attention'}
          </span>
        </div>

        {metrics.workloadDistribution.length > 0 && (
          <div className="text-xs text-muted-foreground">
            💡 Top performer handling {metrics.workloadDistribution[0].count} incidents
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkloadCard;