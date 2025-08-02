import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { TotalIncidentData } from '@/hooks/useNewInsightsData';

interface TotalIncidentsCardProps {
  data: TotalIncidentData;
  onFilterApply: (filterType: string, value: string) => void;
}

const TotalIncidentsCard: React.FC<TotalIncidentsCardProps> = ({
  data,
  onFilterApply
}) => {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Total Incidents</h3>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-2xl font-bold text-foreground mb-1">{data.total}</div>
          <div className="text-xs text-muted-foreground">Total incidents reported</div>
        </div>

        <div className="space-y-3">
          <div 
            className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/70 cursor-pointer transition-colors"
            onClick={() => onFilterApply('status', 'open')}
          >
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Open</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{data.open}</div>
              <div className="text-xs text-muted-foreground">{data.openPercentage.toFixed(1)}%</div>
            </div>
          </div>

          <div 
            className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/70 cursor-pointer transition-colors"
            onClick={() => onFilterApply('status', 'closed')}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Closed</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{data.closed}</div>
              <div className="text-xs text-muted-foreground">{data.closedPercentage.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex text-xs text-muted-foreground mb-1">
            <span>Progress</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${data.closedPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalIncidentsCard;