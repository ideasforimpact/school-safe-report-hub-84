
import { supabase } from '@/integrations/supabase/client';

export interface EditIncidentData {
  id: string;
  ticket_id: string;
  type: string;
  typeId: string;
  category: string;
  categoryId: string;
  subcategory: string;
  subcategoryId: string;
  description: string;
  date: string;
  time: string;
  location: string;
  locationId: string;
  facility: string;
  facilityId: string;
  priority: string;
  priorityId: string;
  status: string;
  statusId: string;
  owner: string;
  ownerId: string;
  reportedBy: string;
  created_by: string;
  assigned_to: string;
  peopleInvolved: any[];
  createdAt: Date;
  updatedAt: Date;
}

export const fetchIncidentForEdit = async (incidentId: string, clientId: string): Promise<EditIncidentData | null> => {
  try {
    console.log('=== EDIT INCIDENT SERVICE ===');
    console.log('fetchIncidentForEdit - Starting with params:', { incidentId, clientId });

    // Fetch incident with optimized query
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
        type_id,
        category_id,
        subcategory_id,
        location_id,
        facility_id,
        priority_id,
        status_id,
        assigned_to,
        created_by
      `)
      .eq('id', incidentId)
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.error('fetchIncidentForEdit - Supabase error:', error);
      throw new Error(`Failed to fetch incident: ${error.message}`);
    }

    if (!incident) {
      console.log('fetchIncidentForEdit - No incident found with ID:', incidentId);
      return null;
    }

    // Fetch all related data in parallel for better performance
    const [
      reportType,
      category,
      subcategory,
      location,
      facility,
      priority,
      status,
      createdEmployee,
      assignedEmployee
    ] = await Promise.all([
      incident.type_id ? supabase.from('incident_report_types').select('id, name').eq('id', incident.type_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.category_id ? supabase.from('incident_categories').select('id, name').eq('id', incident.category_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.subcategory_id ? supabase.from('incident_subcategories').select('id, name').eq('id', incident.subcategory_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.location_id ? supabase.from('campuses').select('id, name').eq('id', incident.location_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.facility_id ? supabase.from('facilities').select('id, name').eq('id', incident.facility_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.priority_id ? supabase.from('incident_priorities').select('id, name').eq('id', incident.priority_id).maybeSingle() : Promise.resolve({ data: null }),
      incident.status_id ? supabase.from('incident_status').select('id, name').eq('id', incident.status_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('employees').select('first_name, last_name').eq('id', incident.created_by).maybeSingle(),
      incident.assigned_to ? supabase.from('employees').select('first_name, last_name').eq('id', incident.assigned_to).maybeSingle() : Promise.resolve({ data: null })
    ]);

    // Parse the date to get date and time
    const incidentDate = new Date(incident.date);
    const dateString = incidentDate.toISOString().split('T')[0];
    const timeString = incidentDate.toTimeString().split(' ')[0].slice(0, 5);

    // Transform the data for the edit form
    const editData: EditIncidentData = {
      id: incident.id,
      ticket_id: incident.ticket_id,
      type: reportType.data?.name || '',
      typeId: incident.type_id || '',
      category: category.data?.name || '',
      categoryId: incident.category_id || '',
      subcategory: subcategory.data?.name || '',
      subcategoryId: incident.subcategory_id || '',
      description: incident.description || '',
      date: dateString,
      time: timeString,
      location: location.data?.name || '',
      locationId: incident.location_id || '',
      facility: facility.data?.name || '',
      facilityId: incident.facility_id || '',
      priority: priority.data?.name || '',
      priorityId: incident.priority_id || '',
      status: status.data?.name || '',
      statusId: incident.status_id || '',
      owner: assignedEmployee.data ? 
        `${assignedEmployee.data.first_name} ${assignedEmployee.data.last_name}` : '',
      ownerId: incident.assigned_to || '',
      reportedBy: createdEmployee.data ? 
        `${createdEmployee.data.first_name} ${createdEmployee.data.last_name}` : '',
      created_by: incident.created_by || '',
      assigned_to: incident.assigned_to || '',
      peopleInvolved: Array.isArray(incident.people_involved) ? incident.people_involved : [],
      createdAt: new Date(incident.created_at),
      updatedAt: new Date(incident.updated_at)
    };

    console.log('fetchIncidentForEdit - Successfully transformed edit data');
    console.log('=== END EDIT INCIDENT SERVICE ===');
    return editData;

  } catch (error) {
    console.error('fetchIncidentForEdit - Service error:', error);
    throw error;
  }
};
