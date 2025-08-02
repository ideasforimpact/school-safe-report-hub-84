import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { ReportTypeDistribution } from '@/hooks/useNewInsightsData';

interface ReportTypeCardProps {
  distribution: ReportTypeDistribution;
  onFilterApply: (filterType: string, value: string) => void;
}

const ReportTypeCard: React.FC<ReportTypeCardProps> = ({ distribution, onFilterApply }) => {
  const topType = distribution.types[0];

  return (
    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white">Report Types</CardTitle>
        <FileText className="h-4 w-4 text-white/80" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topType ? (
            <>
              <div 
                className="cursor-pointer hover:bg-white/20 p-2 rounded transition-colors"
                onClick={() => onFilterApply('type', topType.name)}
              >
                <div className="text-lg font-semibold text-white">{topType.name}</div>
                <div className="text-sm text-white/80">
                  {topType.count} reports ({topType.percentage.toFixed(1)}%)
                </div>
              </div>
              
              <div className="space-y-1">
                {distribution.types.slice(1, 4).map((type, index) => (
                  <div 
                    key={type.name}
                    className="flex justify-between items-center text-sm cursor-pointer hover:bg-white/10 p-1 rounded"
                    onClick={() => onFilterApply('type', type.name)}
                  >
                    <span className="truncate text-white">{type.name}</span>
                    <span className="text-white/80">{type.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-white/80">No report type data available</div>
          )}
          
          <div className="text-xs text-white/80 pt-2 border-t border-white/20">
            Total: {distribution.totalIncidents} reports
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportTypeCard;