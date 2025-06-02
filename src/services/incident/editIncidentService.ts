
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
  peopleInvolved: any[];
  createdAt: Date;
  updatedAt: Date;
}

export const fetchIncidentForEdit = async (incidentId: string, clientId: string): Promise<EditIncidentData | null> => {
  try {
    console.log('=== EDIT INCIDENT SERVICE ===');
    console.log('fetchIncidentForEdit - Starting with params:', { incidentId, clientId });

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
        created_by,
        incident_report_types:type_id (
          id,
          name
        ),
        incident_categories:category_id (
          id,
          name
        ),
        incident_subcategories:subcategory_id (
          id,
          name
        ),
        campuses:location_id (
          id,
          name
        ),
        facilities:facility_id (
          id,
          name
        ),
        incident_priorities:priority_id (
          id,
          name
        ),
        incident_status:status_id (
          id,
          name
        ),
        created_by_employee:employees!created_by(first_name, last_name),
        assigned_employee:employees!assigned_to(first_name, last_name)
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

    console.log('fetchIncidentForEdit - Raw incident data from DB:', incident);

    // Parse the date to get date and time
    const incidentDate = new Date(incident.date);
    const dateString = incidentDate.toISOString().split('T')[0];
    const timeString = incidentDate.toTimeString().split(' ')[0].slice(0, 5);

    console.log('fetchIncidentForEdit - Parsed date and time:', { dateString, timeString });

    // Transform the data for the edit form
    const editData: EditIncidentData = {
      id: incident.id,
      ticket_id: incident.ticket_id,
      type: incident.incident_report_types?.name || '',
      typeId: incident.type_id || '',
      category: incident.incident_categories?.name || '',
      categoryId: incident.category_id || '',
      subcategory: incident.incident_subcategories?.name || '',
      subcategoryId: incident.subcategory_id || '',
      description: incident.description || '',
      date: dateString,
      time: timeString,
      location: incident.campuses?.name || '',
      locationId: incident.location_id || '',
      facility: incident.facilities?.name || '',
      facilityId: incident.facility_id || '',
      priority: incident.incident_priorities?.name || '',
      priorityId: incident.priority_id || '',
      status: incident.incident_status?.name || '',
      statusId: incident.status_id || '',
      owner: incident.assigned_employee ? 
        `${incident.assigned_employee.first_name} ${incident.assigned_employee.last_name}` : '',
      ownerId: incident.assigned_to || '',
      reportedBy: incident.created_by_employee ? 
        `${incident.created_by_employee.first_name} ${incident.created_by_employee.last_name}` : '',
      peopleInvolved: Array.isArray(incident.people_involved) ? incident.people_involved : [],
      createdAt: new Date(incident.created_at),
      updatedAt: new Date(incident.updated_at)
    };

    console.log('fetchIncidentForEdit - Transformed edit data:', editData);
    console.log('=== END EDIT INCIDENT SERVICE ===');
    return editData;

  } catch (error) {
    console.error('fetchIncidentForEdit - Service error:', error);
    throw error;
  }
};
