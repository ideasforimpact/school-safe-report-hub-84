
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
import LearningPoints from './closure/LearningPoints';
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
    learningPoints: string;
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
  
  const [learningPoints, setLearningPoints] = useState(
    incident.learningPoints || ''
  );
  
  const [contributingFactors, setContributingFactors] = useState<ContributingFactor[]>([]);
  const [isLoadingFactors, setIsLoadingFactors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useEmployeeStore();
  const navigate = useNavigate();
  
  // Load and validate contributing factors on mount
  React.useEffect(() => {
    const loadContributingFactors = async () => {
      setIsLoadingFactors(true);
      try {
        // Try multiple field names for backward compatibility
        const factors = incident.contributingFactor || incident.contributingFactors || [];
        
        if (Array.isArray(factors) && factors.length > 0) {
          // Check if any factors have timestamp IDs (old format) instead of UUIDs
          const hasInvalidIds = factors.some(f => f.id && /^\d+$/.test(f.id));
          
          if (hasInvalidIds && state.employeeData?.clientId) {
            // Fetch contributing factors from database to map category names to UUIDs
            const { data: dbFactors } = await supabase
              .from('contributing_factors')
              .select('id, name')
              .eq('client_id', state.employeeData.clientId);
            
            // Map old timestamp IDs to UUIDs by matching category name
            const mappedFactors = factors.map((factor) => {
              // If ID is a timestamp (numeric string), try to find matching UUID by category name
              if (factor.id && /^\d+$/.test(factor.id) && factor.category) {
                const matchingFactor = dbFactors?.find(db => db.name === factor.category);
                if (matchingFactor) {
                  console.log(`Mapped contributing factor "${factor.category}" from timestamp ID ${factor.id} to UUID ${matchingFactor.id}`);
                  return {
                    id: matchingFactor.id, // Use UUID from database
                    category: factor.category,
                    description: factor.description || '',
                    weight: factor.weight || 'Medium' as 'Low' | 'Medium' | 'High'
                  };
                } else {
                  console.warn(`Could not find UUID for contributing factor "${factor.category}" with timestamp ID ${factor.id}`);
                }
              }
              
              // If already a UUID or no category match found, use as-is
              return {
                id: factor.id || '',
                category: factor.category || 'Unknown',
                description: factor.description || '',
                weight: factor.weight || 'Medium' as 'Low' | 'Medium' | 'High'
              };
            }).filter(f => f.id); // Remove factors without valid IDs
            
            setContributingFactors(mappedFactors);
          } else {
            // All IDs are already UUIDs, use as-is
            const validFactors = factors.map((factor) => ({
              id: factor.id || '',
              category: factor.category || 'Unknown',
              description: factor.description || '',
              weight: factor.weight || 'Medium' as 'Low' | 'Medium' | 'High'
            })).filter(f => f.id);
            
            setContributingFactors(validFactors);
          }
        } else {
          setContributingFactors([]);
        }
      } catch (error) {
        console.error('Error loading contributing factors:', error);
        setContributingFactors([]);
      } finally {
        setIsLoadingFactors(false);
      }
    };
    
    loadContributingFactors();
  }, [incident, state.employeeData?.clientId]);
  
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
      // Validate and ensure contributing factors have proper UUIDs from contributing_factors table
      // Each factor should have an 'id' that is a UUID from the contributing_factors table
      const validatedContributingFactors = contributingFactors.map((factor) => {
        // Ensure the id is a valid UUID (not a timestamp)
        if (!factor.id || factor.id.startsWith('existing-') || /^\d+$/.test(factor.id)) {
          console.error('Invalid contributing factor ID detected:', factor);
          throw new Error(`Contributing factor "${factor.category}" has an invalid ID. Please remove and re-add it.`);
        }
        
        // Return only the fields needed for the database
        return {
          id: factor.id, // UUID from contributing_factors table
          category: factor.category,
          description: factor.description,
          weight: factor.weight
        };
      });

      console.log('Closing incident with data:', {
        client_id: state.employeeData.clientId,
        incident_id: incident.id,
        root_cause_analysis: rootCause.trim(),
        learning_points: learningPoints.trim(),
        action_taken: currentAction.description.trim(),
        contributing_factor: validatedContributingFactors
      });

      const { data, error } = await supabase.functions.invoke('close-incident', {
        body: {
          client_id: state.employeeData.clientId,
          incident_id: incident.id,
          root_cause_analysis: rootCause.trim(),
          learning_points: learningPoints.trim(),
          action_taken: currentAction.description.trim(),
          contributing_factor: validatedContributingFactors
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
            closer,
            state.employeeData
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
        learningPoints,
        contributingFactors: validatedContributingFactors,
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

        <div className="space-y-3 my-4">
          {/* Root Cause Analysis */}
          <RootCauseAnalysis 
            rootCause={rootCause}
            setRootCause={setRootCause}
          />

          {/* Learning Points Section */}
          <LearningPoints 
            learningPoints={learningPoints}
            setLearningPoints={setLearningPoints}
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
          {isLoadingFactors ? (
            <div className="space-y-4">
              <h3 className="font-medium">Contributing Factors <span className="text-red-500">*</span></h3>
              <div className="text-sm text-gray-500">Loading contributing factors...</div>
            </div>
          ) : (
          <ContributingFactorsSection 
            contributingFactors={contributingFactors}
            setContributingFactors={setContributingFactors}
          />
          )}
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
