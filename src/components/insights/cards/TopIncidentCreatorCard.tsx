import React from 'react';
import { Card } from '@/components/ui/card';
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
      className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Top Reporter</h3>
          <User className="w-4 h-4 text-white/80" />
        </div>
        
        <div className="space-y-2">
          <div className="text-lg font-bold truncate" title={creator.name}>
            {creator.name}
          </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-white/20">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/80">Total reports</span>
            <span className="text-lg font-bold">{creator.count}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TopIncidentCreatorCard;