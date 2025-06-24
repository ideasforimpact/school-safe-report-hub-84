
import { supabase } from '@/integrations/supabase/client';
import { Incident, Person, UserRef, Document, Comment, ActionItem } from '@/types/incident';

export interface IncidentDetail {
  id: string;
  ticket_id: string;
  type: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  subcategory: {
    id: string;
    name: string;
  };
  description: string;
  date: string;
  location: {
    id: string;
    name: string;
  };
  people_involved: Person[];
  status: {
    id: string;
    name: string;
  };
  priority: {
    id: string;
    name: string;
  };
  facility: {
    id: string;
    name: string;
  };
  created_by: {
    id: string;
    first_name: string;
    last_name: string;
  };
  assigned_to?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  documents: Document[];
  comments: Comment[];
  created_at: string;
  updated_at: string;
  client_id: string;
  root_cause_analysis?: string;
  action_taken?: string;
  contributing_factor?: any[];
  reopen: number;
}

export const fetchIncidentDetail = async (incidentId: string): Promise<IncidentDetail | null> => {
  try {
    console.log('Fetching incident detail for ID:', incidentId);

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
      console.error('Error fetching incident detail:', error);
      return null;
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
      people_involved: incident.people_involved as Person[] || [],
      created_at: incident.created_at,
      updated_at: incident.updated_at,
      client_id: incident.client_id,
      root_cause_analysis: incident.root_cause_analysis,
      action_taken: incident.action_taken,
      contributing_factor: incident.contributing_factor || [],
      documents: incident.documents as Document[] || [],
      comments: incident.comments as Comment[] || [],
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

    console.log('Successfully fetched incident detail:', transformedIncident);
    return transformedIncident;

  } catch (error) {
    console.error('Unexpected error fetching incident detail:', error);
    return null;
  }
};

export const mapIncidentToFormData = (incident: IncidentDetail) => {
  return {
    id: incident.id,
    ticketId: incident.ticket_id,
    type: incident.type.name,
    category: incident.category.name,
    subcategory: incident.subcategory.name,
    description: incident.description,
    date: new Date(incident.date),
    location: incident.location.name,
    peopleInvolved: incident.people_involved || [],
    status: incident.status.name,
    priority: incident.priority.name,
    facility: incident.facility.name,
    reportedBy: {
      id: incident.created_by.id,
      name: `${incident.created_by.first_name} ${incident.created_by.last_name}`
    },
    owner: incident.assigned_to ? {
      id: incident.assigned_to.id,
      name: `${incident.assigned_to.first_name} ${incident.assigned_to.last_name}`
    } : undefined,
    documents: incident.documents || [],
    comments: incident.comments || [],
    createdAt: new Date(incident.created_at),
    updatedAt: new Date(incident.updated_at),
    rootCauseAnalysis: incident.root_cause_analysis,
    actionTaken: incident.action_taken,
    contributingFactors: incident.contributing_factor || [],
    reopen: incident.reopen || 0
  };
};
