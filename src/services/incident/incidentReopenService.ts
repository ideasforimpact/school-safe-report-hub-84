
import { supabase } from '@/integrations/supabase/client';

export interface ReopenIncidentRequest {
  incidentId: string;
  reopenedBy: string;
  reopenReason: string;
}

export interface ReopenIncidentResponse {
  success: boolean;
  message: string;
  incident?: any;
}

export const reopenIncident = async (
  incidentId: string,
  reopenedBy: string,
  reopenReason: string
): Promise<ReopenIncidentResponse> => {
  try {
    console.log('Reopening incident via edge function:', { incidentId, reopenedBy, reopenReason });

    // Call the reopen-incident edge function
    const { data, error } = await supabase.functions.invoke('reopen-incident', {
      body: {
        incident_id: incidentId,
        reopened_by: reopenedBy,
        reopen_reason: reopenReason
      }
    });

    if (error) {
      console.error('Error calling reopen-incident function:', error);
      return {
        success: false,
        message: error.message || 'Failed to reopen incident'
      };
    }

    console.log('Reopen incident response:', data);

    return {
      success: data.success,
      message: data.message,
      incident: data.incident
    };

  } catch (error) {
    console.error('Unexpected error reopening incident:', error);
    return {
      success: false,
      message: 'An unexpected error occurred while reopening the incident'
    };
  }
};
