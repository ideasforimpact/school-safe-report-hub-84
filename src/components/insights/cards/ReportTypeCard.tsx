import React from 'react';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { ReportTypeDistribution } from '@/hooks/useNewInsightsData';

interface ReportTypeCardProps {
  distribution: ReportTypeDistribution;
  onFilterApply: (filterType: string, value: string) => void;
}

const ReportTypeCard: React.FC<ReportTypeCardProps> = ({ distribution, onFilterApply }) => {
  const topType = distribution.types[0];

  return (
    <Card className="bg-gradient-to-br from-green-400 to-green-500 text-white border-none shadow-lg hover:shadow-xl transition-shadow h-36">
      <div className="p-4 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Report Types</h3>
          <FileText className="w-4 h-4 text-white/80" />
        </div>
        
        {topType ? (
          <div className="text-center">
            <div 
              className="cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors"
              onClick={() => onFilterApply('type', topType.name)}
            >
              <div className="text-lg font-bold truncate">{topType.name}</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-white/80">No data available</div>
        )}
        
        <div className="text-center pt-2 border-t border-white/20">
          <span className="text-2xl font-bold">{distribution.totalIncidents}</span>
        </div>
      </div>
    </Card>
  );
};

export default ReportTypeCard;