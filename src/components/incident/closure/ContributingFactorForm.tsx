
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
    description: string;
    weight: 'Low' | 'Medium' | 'High';
  };
  setCurrentFactor: React.Dispatch<React.SetStateAction<{
    category: string;
    description: string;
    weight: 'Low' | 'Medium' | 'High';
  }>>;
  addFactor: () => void;
}

interface ContributingFactorOption {
  id: string;
  name: string;
  weight: string;
}

const ContributingFactorForm: React.FC<ContributingFactorFormProps> = ({
  currentFactor,
  setCurrentFactor,
  addFactor
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
          value={currentFactor.category}
          onValueChange={(value) => setCurrentFactor({...currentFactor, category: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {factorOptions.map((factor) => (
              <SelectItem key={factor.id} value={factor.name}>
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
      
      <div className="mb-3">
        <Input
          value={currentFactor.description}
          onChange={(e) => setCurrentFactor({...currentFactor, description: e.target.value})}
          placeholder="Describe this contributing factor"
        />
      </div>
      
      <Button 
        size="sm" 
        onClick={addFactor}
        disabled={!currentFactor.category || !currentFactor.description}
      >
        <Plus className="h-4 w-4 mr-1" /> Add Factor
      </Button>
    </div>
  );
};

export default ContributingFactorForm;
