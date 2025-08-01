import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResolutionMetrics } from '@/utils/insights/advancedMetrics';

interface ResolutionRateCardProps {
  metrics: ResolutionMetrics;
}

const ResolutionRateCard: React.FC<ResolutionRateCardProps> = ({ metrics }) => {
  const getTrendIcon = () => {
    switch (metrics.resolutionTrend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (metrics.resolutionTrend) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-medium">Resolution Rate</CardTitle>
          <div className="bg-blue-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          </div>
        </div>
        <CardDescription>Incidents successfully resolved</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl md:text-3xl font-semibold text-primary-700">
          {metrics.resolutionRate.toFixed(1)}%
        </p>
        <div className="flex items-center gap-2 mt-2">
          {getTrendIcon()}
          <span className={`text-xs ${getTrendColor()}`}>
            {metrics.previousPeriodResolutionRate !== undefined && (
              `${Math.abs(metrics.resolutionRate - metrics.previousPeriodResolutionRate).toFixed(1)}% vs last period`
            )}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {metrics.resolvedIncidents} of {metrics.totalIncidents} incidents
        </div>
      </CardContent>
    </Card>
  );
};

export default ResolutionRateCard;