
import React from 'react';
import { ContributingFactor } from '@/types/incident';
import { getWeightColor } from '../closure/closureUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContributingFactorsDisplayProps {
  factors?: ContributingFactor[];
}

const ContributingFactorsDisplay: React.FC<ContributingFactorsDisplayProps> = ({
  factors
}) => {
  if (!factors || factors.length === 0) return null;
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-left">Contributing Factors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {factors.map(factor => (
            <div key={factor.id} className="border p-3 rounded-md bg-gray-50 text-left">
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
      </CardContent>
    </Card>
  );
};

export default ContributingFactorsDisplay;
