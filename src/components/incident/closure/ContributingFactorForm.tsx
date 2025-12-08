
import React, { useEffect, useState } from 'react';
import { ContributingFactor } from '@/types/incident';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';

interface ContributingFactorFormProps {
  currentFactor: {
    category: string;
    categoryId?: string; // Add UUID of the contributing factor
    description: string;
    weight: 'Low' | 'Medium' | 'High';
  };
  setCurrentFactor: React.Dispatch<React.SetStateAction<{
    category: string;
    categoryId?: string;
    description: string;
    weight: 'Low' | 'Medium' | 'High';
  }>>;
  addFactor: () => void;
  contributingFactors: ContributingFactor[];
}

interface ContributingFactorOption {
  id: string;
  name: string;
  weight: string;
}

const ContributingFactorForm: React.FC<ContributingFactorFormProps> = ({
  currentFactor,
  setCurrentFactor,
  addFactor,
  contributingFactors
}) => {
  const [factorOptions, setFactorOptions] = useState<ContributingFactorOption[]>([]);
  const [weightOptions, setWeightOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state } = useEmployeeStore();

  useEffect(() => {
    const fetchContributingFactors = async () => {
      try {
        if (!state.employeeData?.clientId) {
          console.log('No client ID available');
          setIsLoading(false);
          return;
        }

        const { data: factors, error } = await supabase
          .from('contributing_factors')
          .select('id, name, weight')
          .eq('client_id', state.employeeData.clientId)
          .order('name');

        if (error) {
          console.error('Error fetching contributing factors:', error);
          return;
        }

        console.log('Fetched contributing factors:', factors);
        setFactorOptions(factors || []);

        // Extract unique weight values
        const uniqueWeights = [...new Set(factors?.map(f => f.weight).filter(Boolean) || [])];
        setWeightOptions(uniqueWeights);

      } catch (error) {
        console.error('Error in fetchContributingFactors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContributingFactors();
  }, [state.employeeData?.clientId]);

  // Filter out already selected factor categories (by UUID)
  const availableFactorOptions = factorOptions.filter(
    factor => !contributingFactors.some(cf => cf.id === factor.id)
  );

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-md p-4 border">
        <h4 className="text-sm font-medium mb-3">Add New Factor</h4>
        <div className="text-sm text-gray-500">Loading factor options...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-md p-4 border">
      <h4 className="text-sm font-medium mb-3">Add New Factor</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Select
          value={currentFactor.categoryId || ''}
          onValueChange={(selectedId) => {
            const selectedFactor = factorOptions.find(f => f.id === selectedId);
            setCurrentFactor({
              ...currentFactor, 
              category: selectedFactor?.name || '',
              categoryId: selectedId
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {availableFactorOptions.map((factor) => (
              <SelectItem key={factor.id} value={factor.id}>
                {factor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={currentFactor.weight}
          onValueChange={(value) => setCurrentFactor({
            ...currentFactor, 
            weight: value as 'Low' | 'Medium' | 'High'
          })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Weight" />
          </SelectTrigger>
          <SelectContent>
            {weightOptions.length > 0 ? (
              weightOptions.map((weight) => (
                <SelectItem key={weight} value={weight}>
                  {weight}
                </SelectItem>
              ))
            ) : (
              <>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="mb-3 space-y-2">
        <label className="text-sm font-medium">
          Description <span className="text-red-500">*</span>
        </label>
        <Input
          value={currentFactor.description}
          onChange={(e) => setCurrentFactor({...currentFactor, description: e.target.value})}
          placeholder="Describe this contributing factor"
          maxLength={150}
        />
        <div className="text-right text-sm text-gray-500">
          {currentFactor.description.length}/150 characters
        </div>
      </div>
      
      <Button 
        size="sm" 
        onClick={addFactor}
        disabled={!currentFactor.category || !currentFactor.categoryId || !currentFactor.description}
      >
        <Plus className="h-4 w-4 mr-1" /> Add Factor
      </Button>
    </div>
  );
};

export default ContributingFactorForm;
