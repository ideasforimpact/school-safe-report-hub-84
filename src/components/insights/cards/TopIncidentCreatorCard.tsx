import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';

interface TopIncidentCreator {
  name: string;
  count: number;
  percentage: number;
}

interface TopIncidentCreatorCardProps {
  creator: TopIncidentCreator;
  onFilterApply: (filterType: string, value: string) => void;
}

const TopIncidentCreatorCard: React.FC<TopIncidentCreatorCardProps> = ({ creator, onFilterApply }) => {
  const handleClick = () => {
    onFilterApply('reporter', creator.name);
  };

  return (
    <Card 
      className="border-none shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <User className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-semibold text-sm text-gray-700">Top Incident Creator</h3>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="mb-3">
          <div className="text-lg font-bold text-gray-900 truncate" title={creator.name}>
            {creator.name}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Reports Created</span>
            <span className="font-medium text-purple-600">{creator.count}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">% of Total</span>
            <span className="font-medium text-gray-900">{creator.percentage}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopIncidentCreatorCard;