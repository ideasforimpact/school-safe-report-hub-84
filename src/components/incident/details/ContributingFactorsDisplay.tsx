
import React from 'react';
import { ContributingFactor } from '@/types/incident';
import { getWeightColor } from '../closure/closureUtils';

interface ContributingFactorsDisplayProps {
  factors?: ContributingFactor[];
}

const ContributingFactorsDisplay: React.FC<ContributingFactorsDisplayProps> = ({
  factors
}) => {
  if (!factors || factors.length === 0) return null;
  
  return (
    <div className="mt-4">
      <h3 className="font-medium text-sm">Contributing Factors</h3>
      <div className="mt-2 space-y-2">
        {factors.map(factor => (
          <div key={factor.id} className="border p-3 rounded-md bg-gray-50">
            <div className="flex justify-between">
              <span className="font-medium">{factor.category}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${getWeightColor(factor.weight)}`}>
                {factor.weight} Impact
              </span>
            </div>
            <p className="text-sm mt-1">{factor.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContributingFactorsDisplay;
