import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertCircle, Target, Timer, TrendingUp } from 'lucide-react';
import { ResponseMetrics } from '@/utils/insights/advancedMetrics';

interface ResponseTimeCardProps {
  metrics: ResponseMetrics;
}

const ResponseTimeCard: React.FC<ResponseTimeCardProps> = ({ metrics }) => {
  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${(hours * 60).toFixed(0)}m`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    } else {
      const days = (hours / 24).toFixed(1);
      return `${days}d`;
    }
  };

  const getSLAColor = (compliance: number) => {
    if (compliance >= 90) return 'text-success';
    if (compliance >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getResponseColor = (hours: number) => {
    if (hours <= 4) return 'text-success';
    if (hours <= 24) return 'text-warning';
    return 'text-destructive';
  };

  const getIconColor = (compliance: number) => {
    if (compliance >= 90) return 'bg-success/10 text-success';
    if (compliance >= 70) return 'bg-warning/10 text-warning';
    return 'bg-destructive/10 text-destructive';
  };

  const getEfficiencyLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-success' };
    if (score >= 60) return { label: 'Good', color: 'text-warning' };
    if (score >= 40) return { label: 'Fair', color: 'text-warning' };
    return { label: 'Needs Improvement', color: 'text-destructive' };
  };

  const efficiency = getEfficiencyLevel(metrics.responseEfficiencyScore);

  return (
    <Card className="border-none shadow-elegant hover:shadow-card-hover transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-semibold">Response Time Efficiency</CardTitle>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center ${getIconColor(metrics.slaCompliance)}`}>
            <Timer className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        </div>
        <CardDescription>Speed and effectiveness of incident response</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl md:text-3xl font-bold ${getResponseColor(metrics.averageResponseTime)}`}>
            {formatTime(metrics.averageResponseTime)}
          </span>
          <span className="text-xs text-muted-foreground">avg response</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">SLA:</span>
            <span className={`font-medium ${getSLAColor(metrics.slaCompliance)}`}>
              {metrics.slaCompliance.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Score:</span>
            <span className={`font-medium ${efficiency.color}`}>
              {metrics.responseEfficiencyScore.toFixed(0)}%
            </span>
          </div>
        </div>

        {metrics.unassignedCount > 0 && (
          <div className="flex items-center gap-1 p-2 bg-warning/5 rounded-md">
            <AlertCircle className="h-3 w-3 text-warning" />
            <span className="text-xs text-warning font-medium">
              {metrics.unassignedCount} incidents awaiting assignment
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <span className="text-muted-foreground">Performance Level:</span>
          <span className={`font-medium ${efficiency.color}`}>{efficiency.label}</span>
        </div>

        {metrics.escalatedCount > 0 && (
          <div className="text-xs text-muted-foreground">
            ⚠️ {metrics.escalatedCount} high-priority incidents require attention
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponseTimeCard;