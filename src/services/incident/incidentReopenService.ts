
import { supabase } from '@/integrations/supabase/client';

export interface ReopenIncidentRequest {
  incidentId: string;
  reopenedBy: string;
}

export interface ReopenIncidentResponse {
  success: boolean;
  message: string;
  incident?: any;
}

export const reopenIncident = async (
  incidentId: string,
  reopenedBy: string
): Promise<ReopenIncidentResponse> => {
  try {
    console.log('Reopening incident:', { incidentId, reopenedBy });

    // First, get the current incident to check its status and get the current reopen count
    const { data: currentIncident, error: fetchError } = await supabase
      .from('incidents')
      .select('id, status_id, reopen, ticket_id')
      .eq('id', incidentId)
      .single();

    if (fetchError) {
      console.error('Error fetching current incident:', fetchError);
      return {
        success: false,
        message: 'Failed to fetch incident details'
      };
    }

    if (!currentIncident) {
      return {
        success: false,
        message: 'Incident not found'
      };
    }

    // Get the "Open" status ID from the incident_status table
    const { data: openStatus, error: statusError } = await supabase
      .from('incident_status')
      .select('id')
      .eq('name', 'Open')
      .single();

    if (statusError || !openStatus) {
      console.error('Error finding Open status:', statusError);
      return {
        success: false,
        message: 'Unable to find Open status'
      };
    }

    // Check if incident is currently closed
    const { data: closedStatus, error: closedStatusError } = await supabase
      .from('incident_status')
      .select('id')
      .eq('name', 'Closed')
      .single();

    if (closedStatusError || !closedStatus) {
      console.error('Error finding Closed status:', closedStatusError);
      return {
        success: false,
        message: 'Unable to find Closed status'
      };
    }

    if (currentIncident.status_id !== closedStatus.id) {
      return {
        success: false,
        message: 'Only closed incidents can be reopened'
      };
    }

    // Calculate new reopen count
    const newReopenCount = (currentIncident.reopen || 0) + 1;

    // Update the incident to reopen it
    const { data: updatedIncident, error: updateError } = await supabase
      .from('incidents')
      .update({
        status_id: openStatus.id,
        reopen: newReopenCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', incidentId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error reopening incident:', updateError);
      return {
        success: false,
        message: 'Failed to reopen incident'
      };
    }

    // Add an audit log entry for the reopen action
    const { error: auditError } = await supabase
      .from('incident_audit_log')
      .insert({
        incident_id: incidentId,
        field_changed: 'status_reopen',
        old_value: 'Closed',
        new_value: `Open (Reopened ${newReopenCount} time${newReopenCount > 1 ? 's' : ''})`,
        changed_by: reopenedBy,
        change_type: 'reopen',
        description: `Incident reopened for the ${newReopenCount}${newReopenCount === 1 ? 'st' : newReopenCount === 2 ? 'nd' : newReopenCount === 3 ? 'rd' : 'th'} time`
      });

    if (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the operation if audit log fails
    }

    console.log('Incident reopened successfully:', updatedIncident);

    return {
      success: true,
      message: `Incident ${currentIncident.ticket_id} has been reopened successfully`,
      incident: updatedIncident
    };

  } catch (error) {
    console.error('Unexpected error reopening incident:', error);
    return {
      success: false,
      message: 'An unexpected error occurred while reopening the incident'
    };
  }
};
