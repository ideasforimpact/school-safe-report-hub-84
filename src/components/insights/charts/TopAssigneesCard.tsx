import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TopContributors } from '@/hooks/useNewInsightsData';
import { UserCheck } from 'lucide-react';

interface TopAssigneesCardProps {
  data: TopContributors;
  onFilterApply?: (filterType: string, value: string) => void;
}

const TopAssigneesCard: React.FC<TopAssigneesCardProps> = ({ data, onFilterApply }) => {
  const assignees = data.contributors.filter(c => c.type === 'assignee').slice(0, 5);

  return (
    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-card hover:shadow-card-hover transition-shadow h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white">Top Assignees</CardTitle>
        <UserCheck className="h-4 w-4 text-white/80" />
      </CardHeader>
      <CardContent>
        {assignees.length === 0 ? (
          <div className="text-sm text-white/80">No assignee data available</div>
        ) : (
          <div className="space-y-2">
            {assignees.map((assignee, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 hover:bg-white/10 rounded cursor-pointer transition-colors"
                onClick={() => onFilterApply?.('assignee', assignee.name)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white truncate">
                    {assignee.name}
                  </span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  {assignee.count}
                </Badge>
              </div>
            ))}
            <div className="text-xs text-white/80 pt-2 border-t border-white/20">
              Total assignments: {assignees.reduce((sum, a) => sum + a.count, 0)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopAssigneesCard;