
import React, { useState } from 'react';
import { Incident, ContributingFactor, Action } from '@/types/incident';
import { Button } from '@/components/ui/button';
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
import ActionsTakenForm from './closure/ActionsTakenForm';
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
  
  // Simplified action state
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
  
  // Add action handler - simplified
  const addAction = () => {
    if (!currentAction.description) return;
    
    const newAction: Action = {
      description: currentAction.description,
      responsiblePerson: '', // Empty as per request
      date: new Date() // Keep for data structure compatibility
    };
    
    setActions([...actions, newAction]);
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
          <ActionsTakenForm
            actions={actions}
            currentAction={currentAction}
            setCurrentAction={setCurrentAction}
            addAction={addAction}
            removeAction={removeAction}
          />

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
