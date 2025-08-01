import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertCircle } from 'lucide-react';
import { ResponseMetrics } from '@/utils/insights/advancedMetrics';

interface ResponseTimeCardProps {
  metrics: ResponseMetrics;
}

const ResponseTimeCard: React.FC<ResponseTimeCardProps> = ({ metrics }) => {
  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    return `${(hours / 24).toFixed(1)}d`;
  };

  const getSLAColor = () => {
    if (metrics.slaCompliance >= 90) return 'text-green-600';
    if (metrics.slaCompliance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-medium">Response Time</CardTitle>
          <div className="bg-orange-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
          </div>
        </div>
        <CardDescription>Average time to assignment</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl md:text-3xl font-semibold text-primary-700">
          {formatTime(metrics.averageResponseTime)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs font-medium ${getSLAColor()}`}>
            {metrics.slaCompliance.toFixed(1)}% SLA Compliance
          </span>
        </div>
        {metrics.unassignedCount > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <span className="text-xs text-red-500">
              {metrics.unassignedCount} unassigned
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponseTimeCard;