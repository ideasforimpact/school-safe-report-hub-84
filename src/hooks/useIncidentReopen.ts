
import { useState } from 'react';
import { reopenIncident } from '@/services/incident/incidentReopenService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts';
import { incidentNotificationService } from '@/services/notification/incidentNotificationService';

export const useIncidentReopen = () => {
  const [isReopening, setIsReopening] = useState(false);
  const { employeeData } = useAuth();
  const handleReopenIncident = async (
    incidentId: string,
    reopenedBy: string,
    reopenReason: string,
    onSuccess?: () => void
  ) => {
    setIsReopening(true);
    
    try {
      const result = await reopenIncident(incidentId, reopenedBy, reopenReason);
      
      if (result.success) {
        // Send notification about incident reopening
        try {
          console.log('=== STARTING REOPEN NOTIFICATION ===');
          console.log('Reopened by ID:', reopenedBy);
          console.log('Reopen reason:', reopenReason);
          console.log('Result incident:', result.incident);

          // The notification is only ever sent when the reopener is the
          // incident's creator (see `ownerIncident` below), so the reopener
          // is always the current user - use the already-loaded
          // `employeeData` instead of re-fetching the same employee row.
          const ownerIncident = result.incident.created_by == employeeData.id;
          const reopener = ownerIncident && employeeData
            ? {
                id: employeeData.id,
                email: employeeData.email,
                first_name: employeeData.firstName,
                last_name: employeeData.lastName,
              }
            : null;
          console.log('Reopener data:', reopener);
          if (ownerIncident && reopener && result.incident) {
            const incidentForNotification = {
              id: incidentId,
              ticket_id: result.incident.ticket_id || '',
              description: result.incident.description || 'Incident',
              created_at: result.incident.created_at,
              created_by: result.incident.created_by,
              assigned_to: result.incident.assigned_to,
              client_id: result.incident.client_id
            };

            console.log('=== CALLING REOPEN NOTIFICATION ===');
            console.log('Incident for notification:', incidentForNotification);
            console.log('Reopener:', reopener);
            console.log('Reopen reason:', reopenReason);

            const notificationResult = await incidentNotificationService.queueIncidentReopenedNotification(
              incidentForNotification,
              reopener,
              reopenReason,
              employeeData,
              // reopen-incident already returned this - skips a redundant
              // employees lookup for the assignee.
              result.assignedEmployee as Record<string, unknown> | null | undefined
            );
            console.log('Reopen notification result:', notificationResult);
          } else {
            console.log('Missing reopener or incident data, skipping notification');
          }
        } catch (notificationError) {
          console.error('Error sending incident reopen notification:', notificationError);
          // Don't fail the reopen if notification fails
        }
        
        toast.success(result.message);
        if (onSuccess) {
          onSuccess();
        }
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      console.error('Error in handleReopenIncident:', error);
      toast.error('Failed to reopen incident');
      return false;
    } finally {
      setIsReopening(false);
    }
  };

  return {
    handleReopenIncident,
    isReopening
  };
};
