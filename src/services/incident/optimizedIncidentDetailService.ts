
import { supabase } from '@/integrations/supabase/client';
import { IncidentDetail } from './incidentDetailService';

export const fetchIncidentWithRelationsOptimized = async (incidentId: string): Promise<IncidentDetail | null> => {
  try {
    console.log('Fetching optimized incident detail for ID:', incidentId);

    const { data: incident, error } = await supabase
      .from('incidents')
      .select(`
        id,
        ticket_id,
        description,
        date,
        people_involved,
        created_at,
        updated_at,
        client_id,
        root_cause_analysis,
        action_taken,
        contributing_factor,
        documents,
        comments,
        reopen,
        type:incident_report_types(id, name),
        category:incident_categories(id, name),
        subcategory:incident_subcategories(id, name),
        location:incident_locations(id, name),
        status:incident_status(id, name),
        priority:incident_priorities(id, name),
        facility:facilities(id, name),
        created_by:employees!incidents_created_by_fkey(id, first_name, last_name),
        assigned_to:employees!incidents_assigned_to_fkey(id, first_name, last_name)
      `)
      .eq('id', incidentId)
      .single();

    if (error) {
      console.error('Error fetching optimized incident detail:', error);
      throw error;
    }

    if (!incident) {
      console.log('No incident found with ID:', incidentId);
      return null;
    }

    console.log('Successfully fetched optimized incident detail:', incident);
    return incident as IncidentDetail;

  } catch (error) {
    console.error('Unexpected error in optimized fetch:', error);
    throw error;
  }
};
