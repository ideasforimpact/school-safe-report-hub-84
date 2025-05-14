
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfigItem } from '@/contexts/types';

export interface ContributingFactor extends ConfigItem {
  category?: string;
  description?: string;
  weight?: 'Low' | 'Medium' | 'High';
}

export function useContributingFactorsManagement(initialFactors: ContributingFactor[] = []) {
  const [contributingFactors, setContributingFactors] = useState<ContributingFactor[]>(initialFactors);

  // Add a new contributing factor
  const addContributingFactor = (name: string, description: string, weight: 'Low' | 'Medium' | 'High') => {
    const newFactor = {
      id: Date.now().toString(),
      name,
      category: "General", // Default category for compatibility
      description,
      weight
    };
    
    setContributingFactors(prev => [...prev, newFactor]);
    toast.success("Contributing factor added successfully");
    console.log("Contributing factor added:", newFactor);
    return newFactor;
  };

  // Update an existing contributing factor
  const updateContributingFactor = (id: string, name: string, description: string, weight: 'Low' | 'Medium' | 'High') => {
    setContributingFactors(prev => prev.map(factor => 
      factor.id === id ? { ...factor, name, description, weight } : factor
    ));
    toast.success("Contributing factor updated successfully");
    console.log("Contributing factor updated:", id, name, description, weight);
  };

  // Delete a contributing factor
  const deleteContributingFactor = (id: string) => {
    setContributingFactors(prev => prev.filter(factor => factor.id !== id));
    toast.success("Contributing factor deleted successfully");
    console.log("Contributing factor deleted:", id);
  };

  return {
    contributingFactors,
    addContributingFactor,
    updateContributingFactor,
    deleteContributingFactor
  };
}
