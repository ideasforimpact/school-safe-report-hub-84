import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertTriangle } from 'lucide-react';
import { FacilityRiskMetrics } from '@/utils/insights/businessMetrics';

interface FacilityRiskCardProps {
  metrics: FacilityRiskMetrics;
  onFacilityClick?: (facilityName: string) => void;
}

const FacilityRiskCard: React.FC<FacilityRiskCardProps> = ({ metrics, onFacilityClick }) => {
  const getRiskLevel = (percentage: number) => {
    if (percentage >= 30) return { level: 'High', color: 'text-destructive' };
    if (percentage >= 15) return { level: 'Medium', color: 'text-warning' };
    return { level: 'Low', color: 'text-success' };
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">High-Risk Facilities</CardTitle>
        <MapPin className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {metrics.topFacilities.length > 0 ? (
            <>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Top Risk: {metrics.mostProblematic}</span>
              </div>
              
              <div className="space-y-2">
                {metrics.topFacilities.slice(0, 3).map((facility, index) => {
                  const risk = getRiskLevel(facility.percentage);
                  return (
                    <div 
                      key={facility.name}
                      className="flex justify-between items-center p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onFacilityClick?.(facility.name)}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-32">
                          {facility.name}
                        </span>
                        <span className={`text-xs ${risk.color}`}>
                          {risk.level} Risk
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{facility.count}</span>
                        <div className="text-xs text-muted-foreground">
                          {facility.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Showing top 3 of {metrics.totalFacilities} facilities
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              No facility data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FacilityRiskCard;