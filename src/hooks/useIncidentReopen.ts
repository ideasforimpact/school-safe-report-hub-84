
import { useState } from 'react';
import { reopenIncident } from '@/services/incident/incidentReopenService';
import { toast } from 'sonner';

export const useIncidentReopen = () => {
  const [isReopening, setIsReopening] = useState(false);

  const handleReopenIncident = async (
    incidentId: string,
    reopenedBy: string,
    onSuccess?: () => void
  ) => {
    setIsReopening(true);
    
    try {
      const result = await reopenIncident(incidentId, reopenedBy);
      
      if (result.success) {
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
