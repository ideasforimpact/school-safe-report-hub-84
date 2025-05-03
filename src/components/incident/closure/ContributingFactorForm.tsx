
import React from 'react';
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

const FACTOR_CATEGORIES = [
  'Human Factors',
  'Environmental Factors',
  'Procedural Factors',
  'Equipment Factors',
  'Organizational Factors',
  'Other'
];

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

const ContributingFactorForm: React.FC<ContributingFactorFormProps> = ({
  currentFactor,
  setCurrentFactor,
  addFactor
}) => {
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
            {FACTOR_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
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
            <SelectItem value="Low">Low Impact</SelectItem>
            <SelectItem value="Medium">Medium Impact</SelectItem>
            <SelectItem value="High">High Impact</SelectItem>
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
