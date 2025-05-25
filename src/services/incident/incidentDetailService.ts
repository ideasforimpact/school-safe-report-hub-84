
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  facility: {
    id: string;
    name: string;
  };
  priority: {
    id: string;
    name: string;
  };
  status: {
    id: string;
    name: string;
  };
  assigned_to?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  created_by: {
    id: string;
    first_name: string;
    last_name: string;
  };
  people_involved: any[];
  documents: any[];
}

export const fetchIncidentWithRelations = async (incidentId: string): Promise<IncidentDetail | null> => {
  try {
    const { data: incident, error } = await supabase
      .from('incidents')
      .select(`
        id,
        ticket_id,
        description,
        date,
        people_involved,
        documents,
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
        )
      `)
      .eq('id', incidentId)
      .single();

    if (error) {
      console.error('Error fetching incident:', error);
      throw error;
    }

    if (!incident) {
      return null;
    }

    // Fetch assigned employee separately if exists
    let assignedEmployee = null;
    if (incident.assigned_to) {
      const { data: assignedEmp, error: assignedError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('id', incident.assigned_to)
        .single();
      
      if (!assignedError && assignedEmp) {
        assignedEmployee = assignedEmp;
      }
    }

    // Fetch created by employee
    const { data: createdEmployee, error: createdError } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .eq('id', incident.created_by)
      .single();

    if (createdError) {
      console.error('Error fetching created by employee:', createdError);
      throw createdError;
    }

    // Transform the data to match our interface
    const transformedIncident: IncidentDetail = {
      id: incident.id,
      ticket_id: incident.ticket_id,
      type: {
        id: incident.type_id || '',
        name: incident.incident_report_types?.name || ''
      },
      category: {
        id: incident.category_id || '',
        name: incident.incident_categories?.name || ''
      },
      subcategory: {
        id: incident.subcategory_id || '',
        name: incident.incident_subcategories?.name || ''
      },
      description: incident.description || '',
      date: incident.date,
      location: {
        id: incident.location_id || '',
        name: incident.campuses?.name || ''
      },
      facility: {
        id: incident.facility_id || '',
        name: incident.facilities?.name || ''
      },
      priority: {
        id: incident.priority_id || '',
        name: incident.incident_priorities?.name || ''
      },
      status: {
        id: incident.status_id || '',
        name: incident.incident_status?.name || ''
      },
      assigned_to: assignedEmployee ? {
        id: assignedEmployee.id,
        first_name: assignedEmployee.first_name,
        last_name: assignedEmployee.last_name
      } : undefined,
      created_by: {
        id: createdEmployee.id,
        first_name: createdEmployee.first_name,
        last_name: createdEmployee.last_name
      },
      people_involved: Array.isArray(incident.people_involved) ? incident.people_involved : [],
      documents: Array.isArray(incident.documents) ? incident.documents : []
    };

    return transformedIncident;

  } catch (error) {
    console.error('Error in fetchIncidentWithRelations:', error);
    toast.error('Failed to fetch incident details');
    return null;
  }
};

export const mapIncidentToFormData = (incident: IncidentDetail) => {
  // Extract date and time from the incident date
  const incidentDate = new Date(incident.date);
  const dateString = incidentDate.toISOString().split('T')[0];
  const timeString = incidentDate.toTimeString().split(' ')[0].slice(0, 5);
  
  const formData = {
    type: incident.type.name as any,
    typeId: incident.type.id,
    categoryId: incident.category.id,
    subcategory: incident.subcategory.name,
    subcategoryId: incident.subcategory.id,
    description: incident.description,
    date: dateString,
    time: timeString,
    locationId: incident.location.id,
    facilityId: incident.facility.id,
    priority: incident.priority.name as 'Low' | 'Medium' | 'High' | 'Critical',
    priorityId: incident.priority.id,
    owner: incident.assigned_to?.id || '',
    status: incident.status.name as any
  };

  return formData;
};
