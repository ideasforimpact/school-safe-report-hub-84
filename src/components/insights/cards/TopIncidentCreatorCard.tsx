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
      className="bg-gradient-to-br from-purple-400 to-purple-500 text-white border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-36"
      onClick={handleClick}
    >
      <div className="p-4 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Top Reporter</h3>
          <User className="w-4 h-4 text-white/80" />
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold truncate" title={creator.name}>
            {creator.name}
          </div>
        </div>
        
        <div className="text-center pt-2 border-t border-white/20">
          <span className="text-2xl font-bold">{creator.count}</span>
        </div>
      </div>
    </Card>
  );
};

export default TopIncidentCreatorCard;