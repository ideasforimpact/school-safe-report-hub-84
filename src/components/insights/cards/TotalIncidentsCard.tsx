import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { TotalIncidentData } from '@/hooks/useNewInsightsData';

interface TotalIncidentsCardProps {
  data: TotalIncidentData;
  onFilterApply: (filterType: string, value: string) => void;
}

const TotalIncidentsCard: React.FC<TotalIncidentsCardProps> = ({ data, onFilterApply }) => {
  return (
    <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-semibold text-sm text-gray-700">Total Incidents</h3>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="text-2xl font-bold text-gray-900 mb-3">
          {data.total.toLocaleString()}
        </div>
        
        <div className="space-y-1">
          <div 
            className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-1 rounded text-sm"
            onClick={() => onFilterApply('status', 'Open')}
          >
            <span className="text-gray-600">Open</span>
            <span className="font-medium text-orange-600">
              {data.open} ({data.openPercentage}%)
            </span>
          </div>
          <div 
            className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-1 rounded text-sm"
            onClick={() => onFilterApply('status', 'Closed')}
          >
            <span className="text-gray-600">Closed</span>
            <span className="font-medium text-green-600">
              {data.closed} ({data.closedPercentage}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalIncidentsCard;