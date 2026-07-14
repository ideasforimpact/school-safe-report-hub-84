
import React, { useState } from 'react';
import { ContributingFactor } from '@/types/incident';
import ContributingFactorForm from './ContributingFactorForm';
import ContributingFactorsList from './ContributingFactorsList';
import { getWeightColor } from './closureUtils';

interface ContributingFactorOption {
  id: string;
  name: string;
  weight: string;
}

interface ContributingFactorsSectionProps {
  contributingFactors: ContributingFactor[];
  setContributingFactors: React.Dispatch<React.SetStateAction<ContributingFactor[]>>;
  factorOptions?: ContributingFactorOption[];
}

const ContributingFactorsSection: React.FC<ContributingFactorsSectionProps> = ({
  contributingFactors,
  setContributingFactors,
  factorOptions = []
}) => {
  const [currentFactor, setCurrentFactor] = useState({
    category: '',
    categoryId: '',
    description: '',
    weight: 'Medium' as 'Low' | 'Medium' | 'High'
  });

  const addFactor = () => {
    if (!currentFactor.category || !currentFactor.description || !currentFactor.categoryId) return;
    
    // Use the actual UUID from the contributing_factors table
    const newFactor: ContributingFactor = {
      id: currentFactor.categoryId, // Use the UUID from the database
      category: currentFactor.category,
      description: currentFactor.description,
      weight: currentFactor.weight
    };
    
    setContributingFactors([...contributingFactors, newFactor]);
    setCurrentFactor({
      category: '',
      categoryId: '',
      description: '',
      weight: 'Medium'
    });
  };

  const removeFactor = (id: string) => {
    setContributingFactors(contributingFactors.filter(factor => factor.id !== id));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Contributing Factors <span className="text-red-500">*</span></h3>
      <p className="text-sm text-gray-600">
        List all factors that contributed to this incident
      </p>

      <ContributingFactorForm
        currentFactor={currentFactor}
        setCurrentFactor={setCurrentFactor}
        addFactor={addFactor}
        contributingFactors={contributingFactors}
        factorOptions={factorOptions}
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
