
import { supabase } from '@/integrations/supabase/client';
import { IncidentRecord } from '@/services/incidentService';

interface PaginationParams {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

interface ServerFilters {
  search?: string;
  category?: string;
  subcategory?: string;
  status?: string;
  priority?: string;
  location?: string;
  facility?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
}

class IncidentDataService {
  private static instance: IncidentDataService;
  private incidentCache: Map<string, PaginatedResponse<IncidentRecord>> = new Map();
  private isLoading = false;

  static getInstance(): IncidentDataService {
    if (!IncidentDataService.instance) {
      IncidentDataService.instance = new IncidentDataService();
    }
    return IncidentDataService.instance;
  }

  // New method with server-side filtering support
  async fetchIncidentsForClientWithFilters(
    clientId: string, 
    forceRefresh = false, 
    employeeData?: any, 
    hasIncidentAdmin?: boolean,
    pagination: PaginationParams = { page: 1, pageSize: 10 },
    filters: ServerFilters = {}
  ): Promise<PaginatedResponse<IncidentRecord>> {
    const { page = 1, pageSize = 10 } = pagination;
    const limitedPageSize = 10;
    const offset = (page - 1) * limitedPageSize;
    
    // Create cache key including filters
    const filterKey = JSON.stringify(filters);
    const cacheKey = `${clientId}_${employeeData?.id || 'unknown'}_${page}_${limitedPageSize}_${filterKey}`;
    
    console.log(`🔄 fetchIncidentsForClientWithFilters called:`);
    console.log(`   - Page: ${page}, PageSize: ${limitedPageSize}, Offset: ${offset}`);
    console.log(`   - Filters:`, filters);
    console.log(`   - Force refresh: ${forceRefresh}`);
    console.log(`   - Cache key: ${cacheKey}`);
    
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.incidentCache.has(cacheKey)) {
      console.log(`✅ Returning cached data for page ${page} with filters`);
      return this.incidentCache.get(cacheKey)!;
    }

    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      console.log('⚠️ Request already in progress, returning cached or empty data');
      return this.incidentCache.get(cacheKey) || {
        data: [],
        totalCount: 0,
        hasMore: false,
        currentPage: page,
        totalPages: 0
      };
    }

    this.isLoading = true;

    try {
      console.log('🚀 Making server request for incidents with filters...');
      
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
        `, { count: 'exact' })
        .eq('client_id', clientId);

      // Apply role-based filtering
      console.log('🔒 Applying role-based filtering:', { employeeData, hasIncidentAdmin });
      if (employeeData) {
        const isSuperAdmin = employeeData.isSuperAdmin === true;
        
        if (!isSuperAdmin) {
          if (hasIncidentAdmin) {
            query = query.or(`created_by.eq.${employeeData.id},assigned_to.eq.${employeeData.id}`);
            console.log(`   - Applied incident admin filter for employee ${employeeData.id}`);
          } else {
            query = query.eq('created_by', employeeData.id);
            console.log(`   - Applied regular user filter for employee ${employeeData.id}`);
          }
        } else {
          console.log('   - Super admin: no additional filtering');
        }
      }

      // Apply server-side filters with improved logic
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.or(`ticket_id.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        console.log(`   - Applied search filter: ${searchTerm}`);
      }

      if (filters.status && filters.status.trim()) {
        // First get the status ID from the incident_status table
        const { data: statusData } = await supabase
          .from('incident_status')
          .select('id')
          .eq('name', filters.status)
          .single();
        
        if (statusData) {
          query = query.eq('status_id', statusData.id);
          console.log(`   - Applied status filter: ${filters.status} (ID: ${statusData.id})`);
        } else {
          console.log(`   - Status not found: ${filters.status}`);
        }
      }

      if (filters.category && filters.category.trim()) {
        // First get the category ID from the incident_categories table
        const { data: categoryData } = await supabase
          .from('incident_categories')
          .select('id')
          .eq('name', filters.category)
          .eq('client_id', clientId)
          .single();
        
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
          console.log(`   - Applied category filter: ${filters.category} (ID: ${categoryData.id})`);
        } else {
          console.log(`   - Category not found: ${filters.category}`);
        }
      }

      if (filters.subcategory && filters.subcategory.trim()) {
        // First get the subcategory ID from the incident_subcategories table
        const { data: subcategoryData } = await supabase
          .from('incident_subcategories')
          .select('id')
          .eq('name', filters.subcategory)
          .eq('client_id', clientId)
          .single();
        
        if (subcategoryData) {
          query = query.eq('subcategory_id', subcategoryData.id);
          console.log(`   - Applied subcategory filter: ${filters.subcategory} (ID: ${subcategoryData.id})`);
        } else {
          console.log(`   - Subcategory not found: ${filters.subcategory}`);
        }
      }

      if (filters.priority && filters.priority.trim()) {
        // First get the priority ID from the incident_priorities table
        const { data: priorityData } = await supabase
          .from('incident_priorities')
          .select('id')
          .eq('name', filters.priority)
          .eq('client_id', clientId)
          .single();
        
        if (priorityData) {
          query = query.eq('priority_id', priorityData.id);
          console.log(`   - Applied priority filter: ${filters.priority} (ID: ${priorityData.id})`);
        } else {
          console.log(`   - Priority not found: ${filters.priority}`);
        }
      }

      if (filters.location && filters.location.trim()) {
        // First get the location ID from the campuses table
        const { data: locationData } = await supabase
          .from('campuses')
          .select('id')
          .eq('name', filters.location)
          .eq('client_id', clientId)
          .single();
        
        if (locationData) {
          query = query.eq('location_id', locationData.id);
          console.log(`   - Applied location filter: ${filters.location} (ID: ${locationData.id})`);
        } else {
          console.log(`   - Location not found: ${filters.location}`);
        }
      }

      if (filters.facility && filters.facility.trim()) {
        // First get the facility ID from the facilities table
        const { data: facilityData } = await supabase
          .from('facilities')
          .select('id')
          .eq('name', filters.facility)
          .eq('client_id', clientId)
          .single();
        
        if (facilityData) {
          query = query.eq('facility_id', facilityData.id);
          console.log(`   - Applied facility filter: ${filters.facility} (ID: ${facilityData.id})`);
        } else {
          console.log(`   - Facility not found: ${filters.facility}`);
        }
      }

      if (filters.dateFrom && filters.dateFrom.trim()) {
        query = query.gte('date', filters.dateFrom);
        console.log(`   - Applied date from filter: ${filters.dateFrom}`);
      }

      if (filters.dateTo && filters.dateTo.trim()) {
        query = query.lte('date', filters.dateTo);
        console.log(`   - Applied date to filter: ${filters.dateTo}`);
      }

      // Apply server-side pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limitedPageSize - 1);

      console.log(`📊 Server query: fetching range ${offset} to ${offset + limitedPageSize - 1}`);

      const { data: incidents, error, count } = await query;

      if (error) {
        console.error('❌ Database query error:', error);
        throw new Error(`Failed to fetch incidents: ${error.message}`);
      }

      console.log(`✅ Server returned ${incidents?.length || 0} incidents for page ${page}`);
      console.log(`📈 Total count from database: ${count}`);

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

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limitedPageSize);
      const hasMore = page < totalPages;

      const response: PaginatedResponse<IncidentRecord> = {
        data: transformedIncidents,
        totalCount,
        hasMore,
        currentPage: page,
        totalPages
      };

      console.log(`📋 Server-side pagination result with filters:`);
      console.log(`   - Page ${page}/${totalPages}`);
      console.log(`   - Records: ${transformedIncidents.length}`);
      console.log(`   - Total: ${totalCount}`);
      console.log(`   - Has more: ${hasMore}`);

      // Cache the results with page-specific key including filters
      this.incidentCache.set(cacheKey, response);
      console.log(`💾 Cached result with key: ${cacheKey}`);
      
      return response;

    } catch (error) {
      console.error('❌ Error in incidentDataService.fetchIncidentsForClientWithFilters:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  // Keep existing method for backward compatibility
  async fetchIncidentsForClient(
    clientId: string, 
    forceRefresh = false, 
    employeeData?: any, 
    hasIncidentAdmin?: boolean,
    pagination: PaginationParams = { page: 1, pageSize: 10 }
  ): Promise<PaginatedResponse<IncidentRecord>> {
    // Delegate to the new method with empty filters
    return this.fetchIncidentsForClientWithFilters(
      clientId,
      forceRefresh,
      employeeData,
      hasIncidentAdmin,
      pagination,
      {}
    );
  }

  // Legacy method for backward compatibility - returns just the incidents array
  async fetchIncidentsForClientLegacy(
    clientId: string, 
    forceRefresh = false, 
    employeeData?: any, 
    hasIncidentAdmin?: boolean
  ): Promise<IncidentRecord[]> {
    const response = await this.fetchIncidentsForClient(clientId, forceRefresh, employeeData, hasIncidentAdmin);
    return response.data;
  }

  // Method to get basic stats without full incident data
  async getIncidentStats(clientId: string, employeeData?: any, hasIncidentAdmin?: boolean): Promise<{
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
      // Clear all cache entries for this client and employee
      const keysToDelete = Array.from(this.incidentCache.keys()).filter(key => 
        key.startsWith(`${clientId}_${employeeId}_`)
      );
      keysToDelete.forEach(key => this.incidentCache.delete(key));
      console.log(`🗑️ Cleared cache for client ${clientId} and employee ${employeeId} (${keysToDelete.length} entries)`);
    } else if (clientId) {
      // Clear all cache entries for this client
      const keysToDelete = Array.from(this.incidentCache.keys()).filter(key => key.startsWith(`${clientId}_`));
      keysToDelete.forEach(key => this.incidentCache.delete(key));
      console.log(`🗑️ Cleared cache for client ${clientId} (${keysToDelete.length} entries)`);
    } else {
      this.incidentCache.clear();
      console.log('🗑️ Cleared all cache');
    }
  }
}

export const incidentDataService = IncidentDataService.getInstance();
