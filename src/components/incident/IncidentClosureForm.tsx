
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
import ActionsTakenForm from './closure/ActionsTakenForm';
import ContributingFactorsSection from './closure/ContributingFactorsSection';

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
  
  // Modified action state - now we'll just have a single action entry
  const [currentAction, setCurrentAction] = useState<Action>({
    description: incident.actions && incident.actions.length > 0 
      ? incident.actions.map(a => a.description).join('\n\n')
      : '',
    responsiblePerson: '',
    date: new Date(),
  });

  const handleSubmit = () => {
    if (!rootCause.trim()) return;
    
    // Create a single action from the text area content
    const actions: Action[] = currentAction.description.trim() 
      ? [{ 
          description: currentAction.description.trim(), 
          responsiblePerson: '', 
          date: new Date() 
        }] 
      : [];
    
    onSubmit({
      rootCause,
      contributingFactors,
      actions
    });
  };

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

          {/* Actions Taken Section - Simplified */}
          <ActionsTakenForm
            actions={[]} // Not used in the simplified version
            currentAction={currentAction}
            setCurrentAction={setCurrentAction}
            addAction={() => {}} // Not used in the simplified version
            removeAction={() => {}} // Not used in the simplified version
          />

          {/* Contributing Factors Section */}
          <ContributingFactorsSection 
            contributingFactors={contributingFactors}
            setContributingFactors={setContributingFactors}
          />
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
