
import { supabase } from '@/integrations/supabase/client';
import { IncidentRecord } from '@/services/incidentService';

class IncidentDataService {
  private static instance: IncidentDataService;
  private incidentCache: Map<string, IncidentRecord[]> = new Map();
  private isLoading = false;

  static getInstance(): IncidentDataService {
    if (!IncidentDataService.instance) {
      IncidentDataService.instance = new IncidentDataService();
    }
    return IncidentDataService.instance;
  }

  async fetchIncidentsForClient(clientId: string, forceRefresh = false): Promise<IncidentRecord[]> {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.incidentCache.has(clientId)) {
      return this.incidentCache.get(clientId)!;
    }

    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      return this.incidentCache.get(clientId) || [];
    }

    this.isLoading = true;

    try {
      const { data: incidents, error } = await supabase
        .from('incidents')
        .select(`
          id,
          ticket_id,
          description,
          date,
          created_at,
          updated_at,
          incident_report_types!type_id(id, name),
          incident_categories!category_id(id, name),
          incident_subcategories!subcategory_id(id, name),
          campuses!location_id(id, name),
          facilities!facility_id(id, name),
          incident_priorities!priority_id(id, name),
          incident_status!status_id(id, name),
          created_by_employee:employees!created_by(id, first_name, last_name),
          assigned_employee:employees!assigned_to(id, first_name, last_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(100);

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

      // Cache the results
      this.incidentCache.set(clientId, transformedIncidents);
      return transformedIncidents;

    } catch (error) {
      console.error('Error in incidentDataService.fetchIncidentsForClient:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  // Method to get basic stats without full incident data
  async getIncidentStats(clientId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    closed: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          id,
          incident_status!status_id(name)
        `)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        open: 0,
        inProgress: 0,
        closed: 0
      };

      data?.forEach((incident: any) => {
        const status = incident.incident_status?.name;
        if (status === 'Open') stats.open++;
        else if (status === 'In Progress') stats.inProgress++;
        else if (status === 'Closed') stats.closed++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching incident stats:', error);
      return { total: 0, open: 0, inProgress: 0, closed: 0 };
    }
  }

  clearCache(clientId?: string): void {
    if (clientId) {
      this.incidentCache.delete(clientId);
    } else {
      this.incidentCache.clear();
    }
  }
}

export const incidentDataService = IncidentDataService.getInstance();
