
import React, { useState } from 'react';
import { ContributingFactor } from '@/types/incident';
import ContributingFactorForm from './ContributingFactorForm';
import ContributingFactorsList from './ContributingFactorsList';
import { getWeightColor } from './closureUtils';

interface ContributingFactorsSectionProps {
  contributingFactors: ContributingFactor[];
  setContributingFactors: React.Dispatch<React.SetStateAction<ContributingFactor[]>>;
}

const ContributingFactorsSection: React.FC<ContributingFactorsSectionProps> = ({
  contributingFactors,
  setContributingFactors
}) => {
  const [currentFactor, setCurrentFactor] = useState({
    category: '',
    description: '',
    weight: 'Medium' as 'Low' | 'Medium' | 'High'
  });

  const addFactor = () => {
    if (!currentFactor.category || !currentFactor.description) return;
    
    const newFactor: ContributingFactor = {
      id: Date.now().toString(),
      ...currentFactor
    };
    
    setContributingFactors([...contributingFactors, newFactor]);
    setCurrentFactor({
      category: '',
      description: '',
      weight: 'Medium'
    });
  };

  const removeFactor = (id: string) => {
    setContributingFactors(contributingFactors.filter(factor => factor.id !== id));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Contributing Factors</h3>
      <p className="text-sm text-gray-600">
        List all factors that contributed to this incident
      </p>

      <ContributingFactorForm
        currentFactor={currentFactor}
        setCurrentFactor={setCurrentFactor}
        addFactor={addFactor}
      />

      {/* Factors List */}
      <ContributingFactorsList
        factors={contributingFactors}
        removeFactor={removeFactor}
        getWeightColor={getWeightColor}
      />
    </div>
  );
};

export default ContributingFactorsSection;
