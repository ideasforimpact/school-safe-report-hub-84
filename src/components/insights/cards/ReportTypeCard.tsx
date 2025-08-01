import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, PieChart } from 'lucide-react';
import { ReportTypeMetrics } from '@/utils/insights/businessMetrics';

interface ReportTypeCardProps {
  metrics: ReportTypeMetrics;
  onTypeClick?: (reportType: string) => void;
}

const ReportTypeCard: React.FC<ReportTypeCardProps> = ({ metrics, onTypeClick }) => {
  const getTypeColor = (index: number) => {
    const colors = ['text-primary', 'text-secondary', 'text-accent', 'text-muted-foreground'];
    return colors[index % colors.length];
  };

  const getTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('near miss') || lowerType.includes('nearmiss')) {
      return '⚠️';
    }
    if (lowerType.includes('incident') || lowerType.includes('accident')) {
      return '🚨';
    }
    if (lowerType.includes('basic') || lowerType.includes('general')) {
      return '📋';
    }
    return '📄';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Report Types</CardTitle>
        <PieChart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {metrics.distribution.length > 0 ? (
            <>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Most Common: {metrics.mostCommon}
                </span>
              </div>
              
              <div className="space-y-2">
                {metrics.distribution.slice(0, 4).map((type, index) => (
                  <div 
                    key={type.type}
                    className="flex justify-between items-center p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onTypeClick?.(type.type)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{getTypeIcon(type.type)}</span>
                      <span className="text-sm font-medium truncate max-w-28">
                        {type.type}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{type.count}</span>
                      <div className="text-xs text-muted-foreground">
                        {type.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Total: {metrics.totalReports} reports across {metrics.distribution.length} types
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              No report type data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportTypeCard;