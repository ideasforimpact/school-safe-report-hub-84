
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';

interface AddCommentPayload {
  comment: string;
  documents: string[];
}

interface AddCommentResponse {
  success: boolean;
  comment?: any;
  message?: string;
  error?: string;
}

export function useAddIncidentComment() {
  const [isLoading, setIsLoading] = useState(false);
  const { state } = useEmployeeStore();

  const addComment = async (incidentId: string, payload: AddCommentPayload): Promise<AddCommentResponse> => {
    if (!state.employeeData?.clientId) {
      toast.error("Access denied: No client association found");
      return { success: false, error: "No client association found" };
    }

    setIsLoading(true);
    
    try {
      //console.log('Adding comment to incident:', incidentId, payload);

      const { data, error } = await supabase.functions.invoke('add-incident-comment', {
        body: {
          client_id: state.employeeData.clientId,
          incident_id: incidentId,
          comment: payload.comment,
          documents: payload.documents
        }
      });

      if (error) {
        console.error('Error calling add-incident-comment function:', error);
        toast.error('Failed to add comment');
        return { success: false, error: error.message };
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        toast.error(data.error);
        return { success: false, error: data.error };
      }

      //console.log('Comment added successfully:', data);
      toast.success('Comment added successfully');
      return { success: true, comment: data.comment, message: data.message };

    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addComment,
    isLoading
  };
}
