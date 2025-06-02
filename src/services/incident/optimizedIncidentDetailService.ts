
import { supabase } from '@/integrations/supabase/client';
import { IncidentDetail } from '@/services/incident/incidentDetailService';

export const fetchIncidentWithRelationsOptimized = async (incidentId: string): Promise<IncidentDetail | null> => {
  try {
    // First fetch the basic incident data
    const { data: incident, error } = await supabase
      .from('incidents')
      .select(`
        id,
        ticket_id,
        description,
        date,
        people_involved,
        documents,
        comments,
        type_id,
        category_id,
        subcategory_id,
        location_id,
        facility_id,
        priority_id,
        status_id,
        assigned_to,
        created_by,
        client_id
      `)
      .eq('id', incidentId)
      .single();

    if (error) {
      throw error;
    }

    if (!incident) {
      return null;
    }

    // Fetch all related data in parallel
    const [
      reportType,
      category,
      subcategory,
      location,
      facility,
      priority,
      status,
      assignedEmployee,
      createdEmployee
    ] = await Promise.all([
      incident.type_id ? supabase.from('incident_report_types').select('id, name').eq('id', incident.type_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.category_id ? supabase.from('incident_categories').select('id, name').eq('id', incident.category_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.subcategory_id ? supabase.from('incident_subcategories').select('id, name').eq('id', incident.subcategory_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.location_id ? supabase.from('campuses').select('id, name').eq('id', incident.location_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.facility_id ? supabase.from('facilities').select('id, name').eq('id', incident.facility_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.priority_id ? supabase.from('incident_priorities').select('id, name').eq('id', incident.priority_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.status_id ? supabase.from('incident_status').select('id, name').eq('id', incident.status_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.assigned_to ? supabase.from('employees').select('id, first_name, last_name').eq('id', incident.assigned_to).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('employees').select('id, first_name, last_name').eq('id', incident.created_by).maybeSingle()
    ]);

    // Transform the data to match our interface
    const transformedIncident: IncidentDetail = {
      id: incident.id,
      ticket_id: incident.ticket_id,
      type: {
        id: incident.type_id || '',
        name: reportType.data?.name || ''
      },
      category: {
        id: incident.category_id || '',
        name: category.data?.name || ''
      },
      subcategory: {
        id: incident.subcategory_id || '',
        name: subcategory.data?.name || ''
      },
      description: incident.description || '',
      date: incident.date,
      location: {
        id: incident.location_id || '',
        name: location.data?.name || ''
      },
      facility: {
        id: incident.facility_id || '',
        name: facility.data?.name || ''
      },
      priority: {
        id: incident.priority_id || '',
        name: priority.data?.name || ''
      },
      status: {
        id: incident.status_id || '',
        name: status.data?.name || ''
      },
      assigned_to: assignedEmployee.data ? {
        id: assignedEmployee.data.id,
        first_name: assignedEmployee.data.first_name,
        last_name: assignedEmployee.data.last_name
      } : undefined,
      created_by: {
        id: createdEmployee.data?.id || '',
        first_name: createdEmployee.data?.first_name || '',
        last_name: createdEmployee.data?.last_name || ''
      },
      people_involved: Array.isArray(incident.people_involved) ? incident.people_involved : [],
      documents: Array.isArray(incident.documents) ? incident.documents : [],
      comments: Array.isArray(incident.comments) ? incident.comments : []
    };

    return transformedIncident;

  } catch (error) {
    console.error('Error in fetchIncidentWithRelationsOptimized:', error);
    return null;
  }
};
