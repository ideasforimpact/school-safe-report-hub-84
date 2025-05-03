
import React, { useState } from 'react';
import { Incident, ContributingFactor } from '@/types/incident';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IncidentClosureFormProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    rootCause: string;
    contributingFactors: ContributingFactor[];
  }) => void;
}

const FACTOR_CATEGORIES = [
  'Human Factors',
  'Environmental Factors',
  'Procedural Factors',
  'Equipment Factors',
  'Organizational Factors',
  'Other'
];

const IncidentClosureForm: React.FC<IncidentClosureFormProps> = ({
  incident,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [rootCause, setRootCause] = useState(incident.rootCause || '');
  const [contributingFactors, setContributingFactors] = useState<ContributingFactor[]>(
    incident.contributingFactors || []
  );
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

  const handleSubmit = () => {
    if (!rootCause.trim()) return;
    
    onSubmit({
      rootCause,
      contributingFactors
    });
  };

  const getWeightColor = (weight: string) => {
    switch (weight) {
      case 'Low':
        return 'bg-blue-100 text-blue-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Close Incident - Final Analysis</DialogTitle>
          <DialogDescription>
            Complete a thorough analysis before closing the incident
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4">
          {/* Root Cause Analysis */}
          <div className="space-y-2">
            <h3 className="font-medium">Root Cause Analysis</h3>
            <p className="text-sm text-gray-600">
              Identify the fundamental reason this incident occurred
            </p>
            <Textarea
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="What was the primary cause of this incident?"
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Contributing Factors */}
          <div className="space-y-4">
            <h3 className="font-medium">Contributing Factors</h3>
            <p className="text-sm text-gray-600">
              List all factors that contributed to this incident
            </p>

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

            {/* Factors List */}
            {contributingFactors.length > 0 ? (
              <div className="space-y-2">
                {contributingFactors.map((factor) => (
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
            ) : (
              <p className="text-sm text-gray-500 italic">No contributing factors added yet</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!rootCause.trim()}>
            Close Incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentClosureForm;
