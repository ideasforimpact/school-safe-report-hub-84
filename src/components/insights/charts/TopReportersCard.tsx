import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TopContributors } from '@/hooks/useNewInsightsData';
import { User } from 'lucide-react';

interface TopReportersCardProps {
  data: TopContributors;
  onFilterApply?: (filterType: string, value: string) => void;
}

const TopReportersCard: React.FC<TopReportersCardProps> = ({ data, onFilterApply }) => {
  const reporters = data.contributors.filter(c => c.type === 'reporter').slice(0, 5);

  return (
    <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white border-none shadow-card hover:shadow-card-hover transition-shadow h-[280px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium text-white">Top Reporters</CardTitle>
        <User className="h-4 w-4 text-white/80" />
      </CardHeader>
      <CardContent className="p-4">
        {reporters.length === 0 ? (
          <div className="text-sm text-white/80">No reporter data available</div>
        ) : (
          <div className="space-y-1.5">
            {reporters.map((reporter, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-1.5 hover:bg-white/10 rounded cursor-pointer transition-colors"
                onClick={() => onFilterApply?.('reporter', reporter.name)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white truncate">
                    {reporter.name}
                  </span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  {reporter.count}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopReportersCard;