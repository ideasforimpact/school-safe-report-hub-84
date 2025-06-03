
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

  async fetchIncidentsForClient(clientId: string, forceRefresh = false, employeeData?: any): Promise<IncidentRecord[]> {
    const cacheKey = `${clientId}_${employeeData?.id || 'unknown'}`;
    
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.incidentCache.has(cacheKey)) {
      return this.incidentCache.get(cacheKey)!;
    }

    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      return this.incidentCache.get(cacheKey) || [];
    }

    this.isLoading = true;

    try {
      let query = supabase
        .from('incidents')
        .select(`
          id,
          ticket_id,
          description,
          date,
          created_at,
          updated_at,
          created_by,
          assigned_to,
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
        .eq('client_id', clientId);

      // Apply filtering based on user role and permissions
      if (employeeData) {
        const isSuperAdmin = employeeData.isSuperAdmin === true;
        
        if (!isSuperAdmin) {
          // Check if user has incident admin access
          const hasIncidentAdmin = employeeData.configuredModules?.some((module: any) => 
            (module.key === 'incidentAdmin' || module.name.toLowerCase().includes('incident')) &&
            (module.accessLevel?.isAdmin === true || module.accessLevel?.is_admin === true)
          );

          if (hasIncidentAdmin) {
            // Incident admin (non-super admin): Own incidents + incidents assigned to them
            query = query.or(`created_by.eq.${employeeData.id},assigned_to.eq.${employeeData.id}`);
          } else {
            // Regular user: Only own incidents
            query = query.eq('created_by', employeeData.id);
          }
        }
        // Super admin: No additional filtering - gets all incidents for the client
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(200);

      const { data: incidents, error } = await query;

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

      // Cache the results with user-specific key
      this.incidentCache.set(cacheKey, transformedIncidents);
      return transformedIncidents;

    } catch (error) {
      console.error('Error in incidentDataService.fetchIncidentsForClient:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  // Method to get basic stats without full incident data
  async getIncidentStats(clientId: string, employeeData?: any): Promise<{
    total: number;
    open: number;
    inProgress: number;
    closed: number;
  }> {
    try {
      let query = supabase
        .from('incidents')
        .select(`
          id,
          created_by,
          assigned_to,
          incident_status!status_id(name)
        `)
        .eq('client_id', clientId);

      // Apply same filtering logic for stats
      if (employeeData) {
        const isSuperAdmin = employeeData.isSuperAdmin === true;
        
        if (!isSuperAdmin) {
          const hasIncidentAdmin = employeeData.configuredModules?.some((module: any) => 
            (module.key === 'incidentAdmin' || module.name.toLowerCase().includes('incident')) &&
            (module.accessLevel?.isAdmin === true || module.accessLevel?.is_admin === true)
          );

          if (hasIncidentAdmin) {
            query = query.or(`created_by.eq.${employeeData.id},assigned_to.eq.${employeeData.id}`);
          } else {
            query = query.eq('created_by', employeeData.id);
          }
        }
      }

      const { data, error } = await query;

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

  clearCache(clientId?: string, employeeId?: string): void {
    if (clientId && employeeId) {
      const cacheKey = `${clientId}_${employeeId}`;
      this.incidentCache.delete(cacheKey);
    } else if (clientId) {
      // Clear all cache entries for this client
      const keysToDelete = Array.from(this.incidentCache.keys()).filter(key => key.startsWith(`${clientId}_`));
      keysToDelete.forEach(key => this.incidentCache.delete(key));
    } else {
      this.incidentCache.clear();
    }
  }
}

export const incidentDataService = IncidentDataService.getInstance();
