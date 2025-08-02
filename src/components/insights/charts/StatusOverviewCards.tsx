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
      <Card className="bg-gradient-to-br from-gray-400 to-gray-500 text-white border-none shadow-card hover:shadow-card-hover transition-shadow h-[280px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-sm text-white/80">No status data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white border-none shadow-card hover:shadow-card-hover transition-shadow h-[280px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-1">
          {data.statuses.map((status, index) => (
            <div key={index} className="flex items-center justify-between p-1.5 hover:bg-white/10 rounded cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(status.name) }}
                />
                <span className="text-sm font-medium text-white truncate">
                  {status.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-white">{status.count}</span>
              </div>
            </div>
          ))}
          <div className="text-xs text-white/80 pt-1 border-t border-white/20">
            Total: {data.totalIncidents}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusOverviewCards;