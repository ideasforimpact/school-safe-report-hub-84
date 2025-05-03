
import React from 'react';
import { ContributingFactor } from '@/types/incident';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ContributingFactorsListProps {
  factors: ContributingFactor[];
  removeFactor: (id: string) => void;
  getWeightColor: (weight: string) => string;
}

const ContributingFactorsList: React.FC<ContributingFactorsListProps> = ({
  factors,
  removeFactor,
  getWeightColor
}) => {
  if (factors.length === 0) {
    return <p className="text-sm text-gray-500 italic">No contributing factors added yet</p>;
  }

  return (
    <div className="space-y-2">
      {factors.map((factor) => (
        <div 
          key={factor.id} 
          className="flex items-start justify-between p-3 border rounded-md"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={getWeightColor(factor.weight)}>
                {factor.weight}
              </Badge>
              <span className="font-medium">{factor.category}</span>
            </div>
            <p className="text-sm">{factor.description}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => removeFactor(factor.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default ContributingFactorsList;
