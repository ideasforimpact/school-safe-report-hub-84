import React from 'react';
import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { TotalIncidentData } from '@/hooks/useNewInsightsData';

interface TotalIncidentsCardProps {
  data: TotalIncidentData;
  onFilterApply: (filterType: string, value: string) => void;
}

const TotalIncidentsCard: React.FC<TotalIncidentsCardProps> = ({ data, onFilterApply }) => {
  return (
    <Card className="bg-gradient-to-br from-blue-400 to-blue-500 text-white border-none shadow-lg hover:shadow-xl transition-shadow h-36">
      <div className="p-4 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Total Incidents</h3>
          <Activity className="w-4 h-4 text-white/80" />
        </div>
        
        <div className="space-y-1">
          <div 
            className="flex justify-between items-center cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors"
            onClick={() => onFilterApply('status', 'Open')}
          >
            <span className="text-xs">Open</span>
            <span className="font-semibold text-sm">{data.open}</span>
          </div>
          <div 
            className="flex justify-between items-center cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors"
            onClick={() => onFilterApply('status', 'Closed')}
          >
            <span className="text-xs">Closed</span>
            <span className="font-semibold text-sm">{data.closed}</span>
          </div>
        </div>
        
        <div className="text-center pt-2 border-t border-white/20">
          <span className="text-2xl font-bold">{data.total}</span>
        </div>
      </div>
    </Card>
  );
};

export default TotalIncidentsCard;