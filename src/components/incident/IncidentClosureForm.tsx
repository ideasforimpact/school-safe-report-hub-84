
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
import { useNavigate } from 'react-router-dom';

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
  // Initialize with existing data using correct field names with fallbacks
  const [rootCause, setRootCause] = useState(
    incident.rootCauseAnalysis || incident.rootCause || ''
  );
  
  const [contributingFactors, setContributingFactors] = useState<ContributingFactor[]>(() => {
    // Try multiple field names for backward compatibility
    const factors = incident.contributingFactor || incident.contributingFactors || [];
    
    // Ensure we have valid contributing factors with proper structure
    if (Array.isArray(factors) && factors.length > 0) {
      return factors.map((factor, index) => ({
        id: factor.id || `existing-${index}`,
        category: factor.category || 'Unknown',
        description: factor.description || '',
        weight: factor.weight || 'Medium' as 'Low' | 'Medium' | 'High'
      }));
    }
    
    return [];
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useEmployeeStore();
  const navigate = useNavigate();
  
  // Initialize current action with existing actionTaken data
  const [currentAction, setCurrentAction] = useState<Action>(() => {
    // Get existing action taken text
    let actionDescription = '';
    
    if (incident.actionTaken) {
      actionDescription = incident.actionTaken;
    } else if (incident.actions && incident.actions.length > 0) {
      // Fallback to actions array if available
      actionDescription = incident.actions.map(a => a.description).join('\n\n');
    }
    
    return {
      description: actionDescription,
      responsiblePerson: '',
      date: new Date(),
    };
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

      // Send notification about incident closure
      try {
        console.log('=== STARTING CLOSURE NOTIFICATION ===');
        console.log('Employee ID:', state.employeeData?.id);
        console.log('Incident:', incident);
        
        const { incidentNotificationService } = await import('@/services/notification/incidentNotificationService');
        
        // Get closer details
        console.log('Fetching closer details for employee ID:', state.employeeData?.id);
        const { data: closer } = await supabase
          .from('employees')
          .select('id, email, first_name, last_name')
          .eq('id', state.employeeData?.id)
          .single();
        
        console.log('Closer data:', closer);

        if (closer) {
          const incidentForNotification = {
            id: incident.id,
            ticket_id: incident.ticketId,
            description: incident.description || 'Incident',
            created_at: incident.createdAt,
            created_by: incident.reportedBy?.id,
            assigned_to: incident.owner?.id,
            client_id: state.employeeData.clientId
          };
          
          console.log('=== CALLING CLOSURE NOTIFICATION ===');
          console.log('Incident for notification:', incidentForNotification);
          console.log('Closer:', closer);

          const result = await incidentNotificationService.queueIncidentClosedNotification(
            incidentForNotification,
            closer
          );
          console.log('Closure notification result:', result);
        } else {
          console.log('No closer data found, skipping notification');
        }
      } catch (notificationError) {
        console.error('Error sending incident closure notification:', notificationError);
        // Don't fail the closure if notification fails
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
      
      // Navigate to incidents list after successful closure
      navigate('/incidents');

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
            {(incident.rootCauseAnalysis || incident.actionTaken || (incident.contributingFactor && incident.contributingFactor.length > 0)) && (
              <span className="block mt-2 text-blue-600 font-medium">
                Previous closure data has been pre-populated. You can review and modify as needed.
              </span>
            )}
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
