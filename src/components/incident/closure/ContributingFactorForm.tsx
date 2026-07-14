
import React, { useMemo } from 'react';
import { ContributingFactor } from '@/types/incident';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DESCRIPTION_MAX_LENGTH } from '@/components/constants';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';

interface ContributingFactorOption {
  id: string;
  name: string;
  weight: string;
}

interface ContributingFactorFormProps {
  currentFactor: {
    category: string;
    categoryId?: string;
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
  factorOptions?: ContributingFactorOption[];
}

const ContributingFactorForm: React.FC<ContributingFactorFormProps> = ({
  currentFactor,
  setCurrentFactor,
  addFactor,
  contributingFactors,
  factorOptions = []
}) => {
  // Derive weight options from provided factor options
  const weightOptions = useMemo(
    () => [...new Set(factorOptions.map(f => f.weight).filter(Boolean))],
    [factorOptions]
  );

  // Filter out already selected factor categories (by UUID)
  const availableFactorOptions = factorOptions.filter(
    factor => !contributingFactors.some(cf => cf.id === factor.id)
  );

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
        <TextareaWithVoice
          value={currentFactor.description} 
           onChange={(e) => {
            const value = e.target.value;
            if (value.startsWith(' ')) return;
            setCurrentFactor({
              ...currentFactor,
              description: value
            });
          }}
          placeholder="Describe this contributing factor"
          maxLength={DESCRIPTION_MAX_LENGTH}
        />
        <div className="text-right text-sm text-gray-500">
          {currentFactor.description.length}/{DESCRIPTION_MAX_LENGTH} characters
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
