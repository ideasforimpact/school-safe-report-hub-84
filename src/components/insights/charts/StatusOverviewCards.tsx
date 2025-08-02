import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusOverview } from '@/hooks/useNewInsightsData';
import { getStatusColor } from '@/utils/chartColorUtils';

interface StatusOverviewCardsProps {
  title: string;
  description: string;
  data: StatusOverview;
}

const StatusOverviewCards: React.FC<StatusOverviewCardsProps> = ({ title, description, data }) => {
  if (data.statuses.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No status data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {data.statuses.map((status, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getStatusColor(status.name) }}
                />
                <div>
                  <p className="font-medium">{status.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {status.percentage.toFixed(1)}% of total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{status.count}</p>
                <p className="text-sm text-muted-foreground">incidents</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Incidents</span>
            <span className="text-lg font-bold">{data.totalIncidents}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusOverviewCards;