import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { ResolutionMetrics } from '@/utils/insights/advancedMetrics';

interface ResolutionRateCardProps {
  metrics: ResolutionMetrics;
}

const ResolutionRateCard: React.FC<ResolutionRateCardProps> = ({ metrics }) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-3 w-3 text-success" />;
      case 'decreasing':
        return <TrendingDown className="h-3 w-3 text-destructive" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-success';
      case 'decreasing':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getIconColor = (rate: number) => {
    if (rate >= 80) return 'bg-success/10 text-success';
    if (rate >= 60) return 'bg-warning/10 text-warning';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <Card className="border-none shadow-elegant hover:shadow-card-hover transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-semibold">Incident Resolution Performance</CardTitle>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center ${getIconColor(metrics.resolutionRate)}`}>
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        </div>
        <CardDescription>Overall success rate in resolving incidents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl md:text-3xl font-bold ${getPerformanceColor(metrics.resolutionRate)}`}>
            {metrics.resolutionRate.toFixed(1)}%
          </span>
          <div className="flex items-center gap-1">
            {getTrendIcon(metrics.resolutionTrend)}
            <span className={`text-xs font-medium ${getTrendColor(metrics.resolutionTrend)}`}>
              {metrics.resolutionTrend}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-success" />
            <span className="text-muted-foreground">Resolved:</span>
            <span className="font-medium">{metrics.resolvedIncidents}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-warning" />
            <span className="text-muted-foreground">Pending:</span>
            <span className="font-medium">{metrics.pendingIncidents}</span>
          </div>
        </div>

        {metrics.overdueIncidents > 0 && (
          <div className="flex items-center gap-1 p-2 bg-destructive/5 rounded-md">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            <span className="text-xs text-destructive font-medium">
              {metrics.overdueIncidents} overdue incidents need attention
            </span>
          </div>
        )}

        {metrics.previousPeriodResolutionRate && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            Previous period: {metrics.previousPeriodResolutionRate.toFixed(1)}%
          </div>
        )}

        {metrics.improvementTips && metrics.improvementTips.length > 0 && (
          <div className="text-xs text-muted-foreground">
            💡 {metrics.improvementTips[0]}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResolutionRateCard;