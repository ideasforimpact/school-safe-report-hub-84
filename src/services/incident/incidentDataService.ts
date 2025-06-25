
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

  // Helper functions for ID lookups
  private async getStatusId(clientId: string, statusName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('incident_status')
        .select('id')
        .eq('name', statusName)
        .maybeSingle();
      
      if (error) {
        console.warn(`Error looking up status ID for "${statusName}":`, error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.warn(`Failed to lookup status ID for "${statusName}":`, error);
      return null;
    }
  }

  private async getCategoryId(clientId: string, categoryName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('incident_categories')
        .select('id')
        .eq('name', categoryName)
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (error) {
        console.warn(`Error looking up category ID for "${categoryName}":`, error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.warn(`Failed to lookup category ID for "${categoryName}":`, error);
      return null;
    }
  }

  private async getSubcategoryId(clientId: string, subcategoryName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('incident_subcategories')
        .select('id')
        .eq('name', subcategoryName)
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (error) {
        console.warn(`Error looking up subcategory ID for "${subcategoryName}":`, error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.warn(`Failed to lookup subcategory ID for "${subcategoryName}":`, error);
      return null;
    }
  }

  private async getPriorityId(clientId: string, priorityName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('incident_priorities')
        .select('id')
        .eq('name', priorityName)
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (error) {
        console.warn(`Error looking up priority ID for "${priorityName}":`, error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.warn(`Failed to lookup priority ID for "${priorityName}":`, error);
      return null;
    }
  }

  private async getLocationId(clientId: string, locationName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('campuses')
        .select('id')
        .eq('name', locationName)
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (error) {
        console.warn(`Error looking up location ID for "${locationName}":`, error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.warn(`Failed to lookup location ID for "${locationName}":`, error);
      return null;
    }
  }

  private async getFacilityId(clientId: string, facilityName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id')
        .eq('name', facilityName)
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (error) {
        console.warn(`Error looking up facility ID for "${facilityName}":`, error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.warn(`Failed to lookup facility ID for "${facilityName}":`, error);
      return null;
    }
  }

  // Method with server-side filtering support and role-based access control
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
    
    console.log(`🔄 fetchIncidentsForClientWithFilters called:`);
    console.log(`   - Page: ${page}, PageSize: ${limitedPageSize}`);
    console.log(`   - Filters:`, filters);
    console.log(`   - Employee Data:`, employeeData);
    console.log(`   - Force refresh: ${forceRefresh}`);

    // Early return if no employee data is provided
    if (!employeeData || !employeeData.id) {
      console.log('⚠️ No employee data provided, returning empty results');
      return {
        data: [],
        totalCount: 0,
        hasMore: false,
        currentPage: page,
        totalPages: 0
      };
    }
    
    const offset = (page - 1) * limitedPageSize;
    
    // Create cache key including filters and user-specific data
    const filterKey = JSON.stringify(filters);
    const userKey = `${employeeData.id}_${employeeData.isSuperAdmin}`;
    const cacheKey = `${clientId}_${userKey}_${page}_${limitedPageSize}_${filterKey}`;
    
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
      console.log('🚀 Making server request for incidents with filters and role-based access...');
      
      // Perform parallel ID lookups for filters
      const [statusId, categoryId, subcategoryId, priorityId, locationId, facilityId] = await Promise.all([
        filters.status ? this.getStatusId(clientId, filters.status) : Promise.resolve(null),
        filters.category ? this.getCategoryId(clientId, filters.category) : Promise.resolve(null),
        filters.subcategory ? this.getSubcategoryId(clientId, filters.subcategory) : Promise.resolve(null),
        filters.priority ? this.getPriorityId(clientId, filters.priority) : Promise.resolve(null),
        filters.location ? this.getLocationId(clientId, filters.location) : Promise.resolve(null),
        filters.facility ? this.getFacilityId(clientId, filters.facility) : Promise.resolve(null)
      ]);

      console.log('🔍 Filter ID lookups completed:', {
        statusId: statusId || 'none',
        categoryId: categoryId || 'none',
        subcategoryId: subcategoryId || 'none',
        priorityId: priorityId || 'none',
        locationId: locationId || 'none',
        facilityId: facilityId || 'none'
      });
      
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

      // Apply role-based filtering based on super admin status
      console.log('🔒 Applying role-based filtering:', { employeeData });
      // Check if user is super admin - use consistent logic with frontend
      const isSuperAdmin = employeeData.isSuperAdmin === true;
      
      if (!isSuperAdmin) {
        // Non-super admin users can only see incidents they created or are assigned to
        query = query.or(`created_by.eq.${employeeData.id},assigned_to.eq.${employeeData.id}`);
        console.log(`   - Applied non-super admin filter for employee ${employeeData.id} (created_by OR assigned_to)`);
      } else {
        console.log('   - Super admin: can see all incidents for this client');
      }

      // Apply server-side filters using foreign key IDs
      if (filters.search && filters.search.trim()) {
        query = query.or(`ticket_id.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        console.log(`   - Applied search filter: ${filters.search}`);
      }

      if (statusId) {
        query = query.eq('status_id', statusId);
        console.log(`   - Applied status filter: ${filters.status} (ID: ${statusId})`);
      } else if (filters.status) {
        console.warn(`   - Status "${filters.status}" not found, skipping status filter`);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
        console.log(`   - Applied category filter: ${filters.category} (ID: ${categoryId})`);
      } else if (filters.category) {
        console.warn(`   - Category "${filters.category}" not found, skipping category filter`);
      }

      if (subcategoryId) {
        query = query.eq('subcategory_id', subcategoryId);
        console.log(`   - Applied subcategory filter: ${filters.subcategory} (ID: ${subcategoryId})`);
      } else if (filters.subcategory) {
        console.warn(`   - Subcategory "${filters.subcategory}" not found, skipping subcategory filter`);
      }

      if (priorityId) {
        query = query.eq('priority_id', priorityId);
        console.log(`   - Applied priority filter: ${filters.priority} (ID: ${priorityId})`);
      } else if (filters.priority) {
        console.warn(`   - Priority "${filters.priority}" not found, skipping priority filter`);
      }

      if (locationId) {
        query = query.eq('location_id', locationId);
        console.log(`   - Applied location filter: ${filters.location} (ID: ${locationId})`);
      } else if (filters.location) {
        console.warn(`   - Location "${filters.location}" not found, skipping location filter`);
      }

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
        console.log(`   - Applied facility filter: ${filters.facility} (ID: ${facilityId})`);
      } else if (filters.facility) {
        console.warn(`   - Facility "${filters.facility}" not found, skipping facility filter`);
      }

      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
        console.log(`   - Applied date from filter: ${filters.dateFrom}`);
      }

      if (filters.dateTo) {
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
        reportedById: inc.created_by_employee?.id || '',
        owner: inc.assigned_employee ? 
          `${inc.assigned_employee.first_name} ${inc.assigned_employee.last_name}` : 
          undefined,
        ownerId: inc.assigned_employee?.id || undefined,
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

      console.log(`📋 Server-side pagination result with role-based access and filters:`);
      console.log(`   - Page ${page}/${totalPages}`);
      console.log(`   - Records: ${transformedIncidents.length}`);
      console.log(`   - Total: ${totalCount}`);
      console.log(`   - Has more: ${hasMore}`);
      console.log(`   - User access level: ${employeeData?.isSuperAdmin ? 'Super Admin' : 'Regular User'}`);

      // Cache the results with page-specific key including filters and user context
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

  async fetchIncidentsForClientLegacy(
    clientId: string, 
    forceRefresh = false, 
    employeeData?: any, 
    hasIncidentAdmin?: boolean
  ): Promise<IncidentRecord[]> {
    const response = await this.fetchIncidentsForClient(clientId, forceRefresh, employeeData, hasIncidentAdmin);
    return response.data;
  }

  async getIncidentStats(clientId: string, employeeData?: any, hasIncidentAdmin?: boolean): Promise<{
    total: number;
    open: number;
    inProgress: number;
    closed: number;
  }> {
    try {
      // Early return if no employee data
      if (!employeeData || !employeeData.id) {
        console.log('⚠️ No employee data provided for stats, returning empty stats');
        return { total: 0, open: 0, inProgress: 0, closed: 0 };
      }

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
      const isSuperAdmin = employeeData.isSuperAdmin === true;
      
      if (!isSuperAdmin) {
        if (hasIncidentAdmin) {
          query = query.or(`created_by.eq.${employeeData.id},assigned_to.eq.${employeeData.id}`);
        } else {
          query = query.eq('created_by', employeeData.id);
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
        key.includes(`${clientId}_${employeeId}`)
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
