
import React, { useState } from 'react';
import { Incident, ContributingFactor, Action } from '@/types/incident';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import RootCauseAnalysis from './closure/RootCauseAnalysis';
import ContributingFactorForm from './closure/ContributingFactorForm';
import ContributingFactorsList from './closure/ContributingFactorsList';
import { getWeightColor } from './closure/closureUtils';

interface IncidentClosureFormProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    rootCause: string;
    contributingFactors: ContributingFactor[];
    actions: Action[];
  }) => void;
}

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
  
  // New state for actions
  const [actions, setActions] = useState<Action[]>(
    incident.actions || []
  );
  const [currentAction, setCurrentAction] = useState<Action>({
    description: '',
    responsiblePerson: '',
    date: new Date(),
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
  
  // Add action handler
  const addAction = () => {
    if (!currentAction.description || !currentAction.responsiblePerson) return;
    
    setActions([...actions, currentAction]);
    setCurrentAction({
      description: '',
      responsiblePerson: '',
      date: new Date(),
    });
  };
  
  // Remove action handler
  const removeAction = (index: number) => {
    const updatedActions = [...actions];
    updatedActions.splice(index, 1);
    setActions(updatedActions);
  };

  const handleSubmit = () => {
    if (!rootCause.trim()) return;
    
    onSubmit({
      rootCause,
      contributingFactors,
      actions
    });
  };

  console.log("Closure form isOpen:", isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Close Incident - Final Analysis</DialogTitle>
          <DialogDescription>
            Complete a thorough analysis before closing the incident
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4">
          {/* Root Cause Analysis */}
          <RootCauseAnalysis 
            rootCause={rootCause}
            setRootCause={setRootCause}
          />

          {/* Actions Taken Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Actions Taken</h3>
            <p className="text-sm text-gray-600">
              List all actions taken to resolve this incident
            </p>
            
            {/* Add Action Form */}
            <div className="space-y-3 border rounded-md p-3 bg-slate-50">
              <div>
                <label className="text-sm font-medium">Action Description</label>
                <Textarea
                  placeholder="Describe what was done to address the incident"
                  value={currentAction.description}
                  onChange={(e) => setCurrentAction(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Responsible Person</label>
                  <Input
                    placeholder="Who handled this action"
                    value={currentAction.responsiblePerson}
                    onChange={(e) => setCurrentAction(prev => ({ ...prev, responsiblePerson: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={currentAction.date ? new Date(currentAction.date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setCurrentAction(prev => ({ ...prev, date: new Date(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={addAction}
                  disabled={!currentAction.description || !currentAction.responsiblePerson}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Action
                </Button>
              </div>
            </div>
            
            {/* Actions List */}
            {actions.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium">Added Actions:</h4>
                {actions.map((action, index) => (
                  <div key={index} className="flex items-start justify-between bg-white p-3 border rounded-md">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{new Date(action.date).toLocaleDateString()}</p>
                      <p>{action.description}</p>
                      <p className="text-sm text-gray-600">By: {action.responsiblePerson}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeAction(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contributing Factors */}
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
