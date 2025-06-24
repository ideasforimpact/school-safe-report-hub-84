
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
        location:campuses(id, name),
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

    // Transform the data to ensure it matches the IncidentDetail interface
    const transformedIncident: IncidentDetail = {
      id: incident.id,
      ticket_id: incident.ticket_id,
      description: incident.description || '',
      date: incident.date,
      people_involved: incident.people_involved as any[] || [],
      created_at: incident.created_at,
      updated_at: incident.updated_at,
      client_id: incident.client_id,
      root_cause_analysis: incident.root_cause_analysis,
      action_taken: incident.action_taken,
      contributing_factor: incident.contributing_factor || [],
      documents: incident.documents as any[] || [],
      comments: incident.comments as any[] || [],
      reopen: incident.reopen || 0,
      type: incident.type || { id: '', name: 'Unknown' },
      category: incident.category || { id: '', name: 'Unknown' },
      subcategory: incident.subcategory || { id: '', name: 'Unknown' },
      location: incident.location || { id: '', name: 'Unknown' },
      status: incident.status || { id: '', name: 'Unknown' },
      priority: incident.priority || { id: '', name: 'Medium' },
      facility: incident.facility || { id: '', name: 'Unknown' },
      created_by: incident.created_by || { id: '', first_name: 'Unknown', last_name: 'User' },
      assigned_to: incident.assigned_to || undefined
    };

    console.log('Successfully fetched optimized incident detail:', transformedIncident);
    return transformedIncident;

  } catch (error) {
    console.error('Unexpected error in optimized fetch:', error);
    throw error;
  }
};
