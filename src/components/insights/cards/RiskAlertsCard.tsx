import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, MapPin } from 'lucide-react';
import { RiskMetrics } from '@/utils/insights/advancedMetrics';

interface RiskAlertsCardProps {
  metrics: RiskMetrics;
}

const RiskAlertsCard: React.FC<RiskAlertsCardProps> = ({ metrics }) => {
  const topRiskLocation = metrics.highRiskLocations[0];

  return (
    <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-medium">Risk Alerts</CardTitle>
          <div className="bg-red-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
          </div>
        </div>
        <CardDescription>High-risk areas requiring attention</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl md:text-3xl font-semibold text-primary-700">
          {metrics.criticalIncidents}
        </p>
        <div className="text-xs text-gray-500 mb-2">Critical incidents</div>
        
        {topRiskLocation && (
          <div className="flex items-center gap-1 mt-2">
            <MapPin className="h-3 w-3 text-red-500" />
            <span className="text-xs text-red-600 font-medium">
              {topRiskLocation.location}
            </span>
            <span className="text-xs text-gray-500">
              ({topRiskLocation.count} incidents)
            </span>
          </div>
        )}
        
        {metrics.recurrentIssues.length > 0 && (
          <div className="text-xs text-yellow-600 mt-1">
            {metrics.recurrentIssues.length} recurring issues detected
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskAlertsCard;