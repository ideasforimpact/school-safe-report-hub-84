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
    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg hover:shadow-xl transition-shadow">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Total Incidents</h3>
          <Activity className="w-4 h-4 text-white/80" />
        </div>
        
        <div className="space-y-2">
          <div 
            className="flex justify-between items-center cursor-pointer hover:bg-white/10 p-2 rounded transition-colors"
            onClick={() => onFilterApply('status', 'Open')}
          >
            <span className="text-sm">Open</span>
            <span className="font-semibold">{data.open}</span>
          </div>
          <div 
            className="flex justify-between items-center cursor-pointer hover:bg-white/10 p-2 rounded transition-colors"
            onClick={() => onFilterApply('status', 'Closed')}
          >
            <span className="text-sm">Closed</span>
            <span className="font-semibold">{data.closed}</span>
          </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-white/20">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/80">Total incidents</span>
            <span className="text-lg font-bold">{data.total}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TotalIncidentsCard;