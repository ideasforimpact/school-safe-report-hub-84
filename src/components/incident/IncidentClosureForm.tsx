
import React, { useEffect, useState } from 'react';
import { Incident, ContributingFactor, Action, FileItem } from '@/types/incident';
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
import ReusableFileUploader from '../common/ReusableFileUploader';

interface ContributingFactorOption {
  id: string;
  name: string;
  weight: string;
}

interface IncidentClosureFormProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    rootCause: string;
    learningPoints: string;
    contributingFactors: ContributingFactor[];
    actions: Action[];
    attachments?: FileItem[];
  }) => void;
  factorOptions?: ContributingFactorOption[];
  preloadedClosureAttachments?: FileItem[];
}

const IncidentClosureForm: React.FC<IncidentClosureFormProps> = ({
  incident,
  isOpen,
  onClose,
  onSubmit,
  factorOptions = [],
  preloadedClosureAttachments = [],
}) => {
  // Initialize with existing data using correct field names with fallbacks
  const [rootCause, setRootCause] = useState(
    incident.rootCauseAnalysis || incident.rootCause || ''
  );
  
  const [learningPoints, setLearningPoints] = useState(
    incident.learningPoints || ''
  );
  
  const [contributingFactors, setContributingFactors] = useState<ContributingFactor[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useEmployeeStore();
  const navigate = useNavigate();
  const [attachments, setAttachments] = useState<FileItem[]>(preloadedClosureAttachments);
  const [existingAttachments, setExistingAttachments] = useState<FileItem[]>(preloadedClosureAttachments);
  
  // Map pre-existing contributing factors on incident or factorOptions change
  React.useEffect(() => {
    const loadContributingFactors = async () => {
      try {
        // Try multiple field names for backward compatibility
        const factors = incident.contributingFactor || incident.contributingFactors || [];
        
        if (Array.isArray(factors) && factors.length > 0) {
          // Check if any factors have timestamp IDs (old format) instead of UUIDs
          const hasInvalidIds = factors.some(f => f.id && /^\d+$/.test(f.id));
          
          if (hasInvalidIds) {
            // Map old timestamp IDs to UUIDs by matching category name from pre-loaded factorOptions
            const mappedFactors = factors.map((factor) => {
              // If ID is a timestamp (numeric string), try to find matching UUID by category name
              if (factor.id && /^\d+$/.test(factor.id) && factor.category) {
                const matchingFactor = factorOptions.find(db => db.name === factor.category);
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
        console.error('Error mapping contributing factors:', error);
        setContributingFactors([]);
      }
    };

    loadContributingFactors();
  }, [incident, factorOptions]);

  // Sync preloaded attachments when they change (e.g. after incident reload)
  useEffect(() => {
    setAttachments(preloadedClosureAttachments);
    setExistingAttachments(preloadedClosureAttachments);
  }, [preloadedClosureAttachments]);
  
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

      const newAttachments = attachments.filter((file) => {
        if (!file.base64) return false;
        return file.base64.startsWith('data:');
      });
      const currentAttachmentIds = new Set(attachments.map((file) => file.id));
      const deletedAttachmentIds = existingAttachments
        .map((file) => file.id)
        .filter((id) => id && !currentAttachmentIds.has(id));

      const { data, error } = await supabase.functions.invoke('close-incident', {
        body: {
          client_id: state.employeeData.clientId,
          incident_id: incident.id,
          root_cause_analysis: rootCause.trim(),
          learning_points: learningPoints.trim(),
          action_taken: currentAction.description.trim(),
          contributing_factor: validatedContributingFactors,
          attachments: newAttachments,
          deleted_attachment_ids: deletedAttachmentIds,
          closer_first_name: state.employeeData.firstName,
          closer_last_name: state.employeeData.lastName,
          notification_base_url: window.location.origin
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
        learningPoints,
        contributingFactors: validatedContributingFactors,
        actions,
        attachments 
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
          <ContributingFactorsSection
            contributingFactors={contributingFactors}
            setContributingFactors={setContributingFactors}
            factorOptions={factorOptions}
          />
        </div>

        {/* Attachment Section (Optional) */}
          <div className="space-y-2">
            <h3 className="font-medium">
              Attachments <span className="text-gray-500 text-sm">(Optional)</span>
            </h3>

            <ReusableFileUploader
              onFilesChange={setAttachments}
              initialFiles={existingAttachments}
              maxFiles={3}
              maxSize={5}
              maxTotalSize={15}
              allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']}
              accept="image/*,.pdf"
              showFileList={true}
              disabled={isSubmitting}
              removeIconVariant="close"
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
