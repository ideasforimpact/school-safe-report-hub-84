
import { supabase } from '@/integrations/supabase/client';
import { IncidentRecord } from '@/services/incidentService';

export const optimizedIncidentService = {
  async fetchIncidents(clientId: string): Promise<IncidentRecord[]> {
    try {
      // Use a more optimized query with proper indexing
      const { data: incidents, error } = await supabase
        .from('incidents')
        .select(`
          id,
          ticket_id,
          description,
          date,
          created_at,
          updated_at,
          type_id,
          category_id,
          subcategory_id,
          location_id,
          facility_id,
          priority_id,
          status_id,
          created_by,
          assigned_to
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10); // Increase limit to include more records including closed ones

      if (error) {
        throw new Error(`Failed to fetch incidents: ${error.message}`);
      }

      if (!incidents || incidents.length === 0) {
        return [];
      }

      // Fetch related data in separate optimized queries
      const [
        reportTypes,
        categories,
        subcategories,
        locations,
        facilities,
        priorities,
        statuses,
        employees
      ] = await Promise.all([
        supabase.from('incident_report_types').select('id, name').eq('client_id', clientId),
        supabase.from('incident_categories').select('id, name').eq('client_id', clientId),
        supabase.from('incident_subcategories').select('id, name').eq('client_id', clientId),
        supabase.from('campuses').select('id, name').eq('client_id', clientId),
        supabase.from('facilities').select('id, name').eq('client_id', clientId),
        supabase.from('incident_priorities').select('id, name').eq('client_id', clientId),
        supabase.from('incident_status').select('id, name'),
        supabase.from('employees').select('id, first_name, last_name').eq('client_id', clientId)
      ]);

      // Create lookup maps for better performance
      const reportTypesMap = new Map(reportTypes.data?.map(t => [t.id, t.name]) || []);
      const categoriesMap = new Map(categories.data?.map(c => [c.id, c.name]) || []);
      const subcategoriesMap = new Map(subcategories.data?.map(s => [s.id, s.name]) || []);
      const locationsMap = new Map(locations.data?.map(l => [l.id, l.name]) || []);
      const facilitiesMap = new Map(facilities.data?.map(f => [f.id, f.name]) || []);
      const prioritiesMap = new Map(priorities.data?.map(p => [p.id, p.name]) || []);
      const statusesMap = new Map(statuses.data?.map(s => [s.id, s.name]) || []);
      const employeesMap = new Map(employees.data?.map(e => [e.id, `${e.first_name} ${e.last_name}`]) || []);

      // Transform incidents using lookup maps
      const transformedIncidents: IncidentRecord[] = incidents.map((inc: any) => ({
        id: inc.id,
        ticket_id: inc.ticket_id,
        type: reportTypesMap.get(inc.type_id) || 'Unknown',
        category: categoriesMap.get(inc.category_id) || 'Unknown',
        subcategory: subcategoriesMap.get(inc.subcategory_id) || '',
        description: inc.description || '',
        date: new Date(inc.date),
        location: locationsMap.get(inc.location_id) || 'Unknown',
        facility: facilitiesMap.get(inc.facility_id) || '',
        status: statusesMap.get(inc.status_id) || 'Unknown',
        priority: prioritiesMap.get(inc.priority_id) || 'Medium',
        reportedBy: employeesMap.get(inc.created_by) || 'Unknown',
        owner: inc.assigned_to ? employeesMap.get(inc.assigned_to) : undefined,
        createdAt: new Date(inc.created_at),
        updatedAt: new Date(inc.updated_at)
      }));

      return transformedIncidents;

    } catch (error) {
      console.error('Error in optimizedIncidentService.fetchIncidents:', error);
      throw error;
    }
  }
};
