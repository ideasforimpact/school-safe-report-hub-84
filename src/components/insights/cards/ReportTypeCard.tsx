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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Report Types</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topType ? (
            <>
              <div 
                className="cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                onClick={() => onFilterApply('type', topType.name)}
              >
                <div className="text-lg font-semibold">{topType.name}</div>
                <div className="text-sm text-muted-foreground">
                  {topType.count} reports ({topType.percentage.toFixed(1)}%)
                </div>
              </div>
              
              <div className="space-y-1">
                {distribution.types.slice(1, 4).map((type, index) => (
                  <div 
                    key={type.name}
                    className="flex justify-between items-center text-sm cursor-pointer hover:bg-muted/30 p-1 rounded"
                    onClick={() => onFilterApply('type', type.name)}
                  >
                    <span className="truncate">{type.name}</span>
                    <span className="text-muted-foreground">{type.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No report type data available</div>
          )}
          
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Total: {distribution.totalIncidents} reports
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportTypeCard;