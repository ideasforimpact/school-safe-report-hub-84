
import { supabase } from '@/integrations/supabase/client';
import { IncidentDetail } from './incidentDetailService';
import { Person, Document, Comment } from '@/types/incident';

// Helper functions for safe type conversion
const safeArrayCast = <T>(value: any, fallback: T[] = []): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return fallback;
};

const safeObjectCast = <T>(value: any, fallback: T): T => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
};

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
        learning_points,
        documents,
        comments,
        reopen,
        recommended_action,
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

    // Transform the data to ensure it matches the IncidentDetail interface with safe casting
    const transformedIncident: IncidentDetail = {
      id: incident.id,
      ticket_id: incident.ticket_id,
      description: incident.description || '',
      date: incident.date,
      people_involved: safeArrayCast<Person>(incident.people_involved, []),
      created_at: incident.created_at,
      updated_at: incident.updated_at,
      client_id: incident.client_id,
      root_cause_analysis: incident.root_cause_analysis,
      action_taken: incident.action_taken,
      learning_points : incident.learning_points,
      contributing_factor: safeArrayCast(incident.contributing_factor, []),
      documents: safeArrayCast<Document>(incident.documents, []),
      comments: safeArrayCast<Comment>(incident.comments, []),
      reopen: incident.reopen || 0,
      recommended_action: incident.recommended_action,
      type: safeObjectCast(incident.type, { id: '', name: 'Unknown' }),
      category: safeObjectCast(incident.category, { id: '', name: 'Unknown' }),
      subcategory: safeObjectCast(incident.subcategory, { id: '', name: 'Unknown' }),
      location: safeObjectCast(incident.location, { id: '', name: 'Unknown' }),
      status: safeObjectCast(incident.status, { id: '', name: 'Unknown' }),
      priority: safeObjectCast(incident.priority, { id: '', name: 'Medium' }),
      facility: safeObjectCast(incident.facility, { id: '', name: 'Unknown' }),
      created_by: safeObjectCast(incident.created_by, { id: '', first_name: 'Unknown', last_name: 'User' }),
      assigned_to: incident.assigned_to ? safeObjectCast(incident.assigned_to, undefined) : undefined
    };

    console.log('Successfully fetched optimized incident detail:', transformedIncident);
    return transformedIncident;

  } catch (error) {
    console.error('Unexpected error in optimized fetch:', error);
    throw error;
  }
};
