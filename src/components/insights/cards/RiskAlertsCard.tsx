import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, MapPin } from 'lucide-react';
import { RiskMetrics } from '@/utils/insights/advancedMetrics';

interface RiskAlertsCardProps {
  metrics: RiskMetrics;
}

const RiskAlertsCard: React.FC<RiskAlertsCardProps> = ({ metrics }) => {
  const topRiskLocation = metrics.highRiskLocations[0];
  const topPriority = metrics.priorityDistribution[0];

  const getRiskLevel = (criticalCount: number, totalLocations: number) => {
    const riskRatio = criticalCount / Math.max(totalLocations, 1);
    if (riskRatio >= 0.3) return { level: 'High', color: 'text-destructive' };
    if (riskRatio >= 0.1) return { level: 'Medium', color: 'text-warning' };
    return { level: 'Low', color: 'text-success' };
  };

  const riskAssessment = getRiskLevel(metrics.criticalIncidents, metrics.highRiskLocations.length);

  const getIconColor = (criticalCount: number) => {
    if (criticalCount >= 10) return 'bg-destructive/10 text-destructive';
    if (criticalCount >= 5) return 'bg-warning/10 text-warning';
    return 'bg-success/10 text-success';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return '↗️';
    if (trend < 0) return '↘️';
    return '➡️';
  };

  return (
    <Card className="border-none shadow-elegant hover:shadow-card-hover transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-semibold">Risk & Priority Management</CardTitle>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center ${getIconColor(metrics.criticalIncidents)}`}>
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        </div>
        <CardDescription>Critical incidents and high-risk areas monitoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl md:text-3xl font-bold ${riskAssessment.color}`}>
            {metrics.criticalIncidents}
          </span>
          <span className="text-xs text-muted-foreground">critical incidents</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Risk zones:</span>
            <span className="font-medium">{metrics.highRiskLocations.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Recurring:</span>
            <span className="font-medium">{metrics.recurrentIssues.length}</span>
          </div>
        </div>

        {topRiskLocation && (
          <div className="p-2 bg-destructive/5 rounded-md">
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3 text-destructive" />
              <span className="text-xs font-medium text-destructive">Highest Risk Location</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {topRiskLocation.location} ({topRiskLocation.count} incidents, {topRiskLocation.riskScore}x risk)
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <span className="text-muted-foreground">Risk Level:</span>
          <span className={`font-medium ${riskAssessment.color}`}>{riskAssessment.level}</span>
        </div>

        {metrics.riskTrends.weekOverWeek !== 0 && (
          <div className="text-xs text-muted-foreground">
            {getTrendIcon(metrics.riskTrends.weekOverWeek)} 
            {Math.abs(metrics.riskTrends.weekOverWeek)}% week-over-week change
          </div>
        )}

        {topPriority && (
          <div className="text-xs text-muted-foreground">
            📊 {topPriority.priority} priority: {topPriority.percentage}% of incidents
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskAlertsCard;