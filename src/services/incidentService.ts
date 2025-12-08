
import { supabase } from '@/integrations/supabase/client';
import { Incident } from '@/types/incident';

export interface IncidentRecord {
  id: string;
  ticket_id: string;
  type: string;
  category: string;
  subcategory: string;
  description: string;
  peopleInvolved?: Array<{ name?: string; role?: string; notes?: string }>;
  date: Date;
  location: string;
  facility: string;
  status: string;
  priority: string;
  reportedBy: string;
  reportedById: string; // Add employee ID for permission checks
  owner?: string;
  ownerId?: string; // Add employee ID for permission checks
  createdAt: Date;
  updatedAt: Date;
  is_voided?: boolean;
  root_cause?: string | null;
  learning_points?: string | null;
  action_taken?: string | null;
  recommended_action?: any | null;
}

export const incidentService = {
  async fetchIncidents(clientId: string): Promise<IncidentRecord[]> {
    try {
      console.log('Fetching incidents for client:', clientId);

      const { data: incidents, error } = await supabase
        .from('incidents')
        .select(`
          id,
          ticket_id,
          description,
          reopen,
          recommended_action,
          date,
          created_at,
          updated_at,
          incident_report_types:type_id(name),
          incident_categories:category_id(name),
          incident_subcategories:subcategory_id(name),
          campuses:location_id(name),
          facilities:facility_id(name),
          incident_priorities:priority_id(name),
          incident_status:status_id(name),
          created_by_employee:employees!created_by(id, first_name, last_name),
          assigned_employee:employees!assigned_to(id, first_name, last_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching incidents:', error);
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
        status: inc.incident_status?.name || (inc.reopen === 1 ? 'Reopen' : 'Unknown'),
        priority: inc.incident_priorities?.name || 'Medium',
        reportedBy: inc.created_by_employee ? 
          `${inc.created_by_employee.first_name} ${inc.created_by_employee.last_name}` : 
          'Unknown',
        reportedById: inc.created_by_employee?.id || '',
        owner: inc.assigned_employee ? 
          `${inc.assigned_employee.first_name} ${inc.assigned_employee.last_name}` : 
          undefined,
        ownerId: inc.assigned_employee?.id || undefined,
        createdAt: new Date(inc.created_at),
        updatedAt: new Date(inc.updated_at)
      }));

      console.log(`Successfully fetched ${transformedIncidents.length} incidents`);
      return transformedIncidents;

    } catch (error) {
      console.error('Error in incidentService.fetchIncidents:', error);
      throw error;
    }
  }
};
