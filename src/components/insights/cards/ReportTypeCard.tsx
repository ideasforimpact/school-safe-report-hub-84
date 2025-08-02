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
    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg hover:shadow-xl transition-shadow">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Report Types</h3>
          <FileText className="w-4 h-4 text-white/80" />
        </div>
        
        {topType ? (
          <div className="space-y-2">
            <div 
              className="cursor-pointer hover:bg-white/10 p-2 rounded transition-colors"
              onClick={() => onFilterApply('type', topType.name)}
            >
              <div className="text-lg font-bold truncate">{topType.name}</div>
              <div className="text-sm text-white/80">{topType.count} reports</div>
            </div>
            
            {distribution.types.slice(1, 3).map((type) => (
              <div 
                key={type.name}
                className="flex justify-between items-center text-sm cursor-pointer hover:bg-white/10 p-1 rounded"
                onClick={() => onFilterApply('type', type.name)}
              >
                <span className="truncate">{type.name}</span>
                <span className="font-semibold">{type.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-white/80">No data available</div>
        )}
        
        <div className="mt-3 pt-2 border-t border-white/20">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/80">Total reports</span>
            <span className="text-lg font-bold">{distribution.totalIncidents}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ReportTypeCard;