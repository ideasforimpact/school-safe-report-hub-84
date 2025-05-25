
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
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { toast } from 'sonner';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useEmployeeStore();
  
  // Modified action state - now we'll just have a single action entry
  const [currentAction, setCurrentAction] = useState<Action>({
    description: incident.actions && incident.actions.length > 0 
      ? incident.actions.map(a => a.description).join('\n\n')
      : '',
    responsiblePerson: '',
    date: new Date(),
  });

  const handleSubmit = async () => {
    if (!rootCause.trim()) {
      toast.error('Root cause analysis is required');
      return;
    }
    
    if (!currentAction.description.trim()) {
      toast.error('Action taken is required');
      return;
    }
    
    if (contributingFactors.length === 0) {
      toast.error('At least one contributing factor is required');
      return;
    }

    if (!state.employeeData?.clientId) {
      toast.error('Client information not found');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Closing incident with data:', {
        client_id: state.employeeData.clientId,
        incident_id: incident.id,
        root_cause_analysis: rootCause.trim(),
        action_taken: currentAction.description.trim(),
        contributing_factor: contributingFactors
      });

      const { data, error } = await supabase.functions.invoke('close-incident', {
        body: {
          client_id: state.employeeData.clientId,
          incident_id: incident.id,
          root_cause_analysis: rootCause.trim(),
          action_taken: currentAction.description.trim(),
          contributing_factor: contributingFactors
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to close incident');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Incident closed successfully');
      
      // Call the original onSubmit for any additional processing
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

      onClose();

    } catch (error: any) {
      console.error('Error closing incident:', error);
      toast.error(error.message || 'Failed to close incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Close Incident - Final Analysis</DialogTitle>
          <DialogDescription>
            Complete a thorough analysis before closing the incident. All fields are required.
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
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!rootCause.trim() || !currentAction.description.trim() || contributingFactors.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Closing...' : 'Close Incident'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentClosureForm;
