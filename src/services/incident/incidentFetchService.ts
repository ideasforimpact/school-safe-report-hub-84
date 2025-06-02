
import { supabase } from '@/integrations/supabase/client';
import { IncidentRecord } from '@/services/incidentService';

export const incidentFetchService = {
  async fetchIncidentsByClientId(clientId: string): Promise<IncidentRecord[]> {
    try {
      const { data: incidents, error } = await supabase
        .from('incidents')
        .select(`
          id,
          ticket_id,
          description,
          date,
          people_involved,
          documents,
          comments,
          created_at,
          updated_at,
          incident_report_types:type_id(name),
          incident_categories:category_id(name),
          incident_subcategories:subcategory_id(name),
          campuses:location_id(name),
          facilities:facility_id(name),
          incident_priorities:priority_id(name),
          incident_status:status_id(name),
          created_by_employee:employees!created_by(first_name, last_name),
          assigned_employee:employees!assigned_to(first_name, last_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch incidents: ${error.message}`);
      }

      const transformedIncidents: IncidentRecord[] = (incidents || []).map((inc: any) => ({
        id: inc.id,
        ticket_id: inc.ticket_id,
        type: inc.incident_report_types?.name || 'Unknown',
        category: inc.incident_categories?.name || 'Unknown',
        subcategory: inc.incident_subcategories?.name || '',
        description: inc.description || '',
        date: new Date(inc.date),
        location: inc.campuses?.name || 'Unknown',
        facility: inc.facilities?.name || '',
        status: inc.incident_status?.name || 'Unknown',
        priority: inc.incident_priorities?.name || 'Medium',
        reportedBy: inc.created_by_employee ? 
          `${inc.created_by_employee.first_name} ${inc.created_by_employee.last_name}` : 
          'Unknown',
        owner: inc.assigned_employee ? 
          `${inc.assigned_employee.first_name} ${inc.assigned_employee.last_name}` : 
          undefined,
        createdAt: new Date(inc.created_at),
        updatedAt: new Date(inc.updated_at)
      }));

      return transformedIncidents;

    } catch (error) {
      console.error('Error in incidentFetchService.fetchIncidentsByClientId:', error);
      throw error;
    }
  }
};
