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
  config?: any; // New field for consolidated config data
}

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

  // Method with server-side filtering but optional client-side pagination
  async fetchIncidentsForClientWithFilters(
    clientId: string, 
    forceRefresh = false, 
    employeeData?: any, 
    hasIncidentAdmin?: boolean,
    pagination: PaginationParams = { page: 1, pageSize: 10 },
    filters: ServerFilters = {},
    returnAllData = false // New parameter to control pagination behavior
  ): Promise<PaginatedResponse<IncidentRecord>> {
    const { page = 1, pageSize = 10 } = pagination;
    
    console.log(`🔄 fetchIncidentsForClientWithFilters called (EAGER LOADING):`);
    console.log(`   - Page: ${page}, PageSize: ${pageSize}`);
    console.log(`   - Return All Data: ${returnAllData}`);
    console.log(`   - Filters:`, filters);
    console.log(`   - Employee Data:`, employeeData);
    console.log(`   - Has Incident Admin:`, hasIncidentAdmin);
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
    
    // Create cache key including filters and user-specific data (no page info)
    const filterKey = JSON.stringify(filters);
    const userKey = `${employeeData.id}_${employeeData.isSuperAdmin}_${hasIncidentAdmin}`;
    const cacheKey = `${clientId}_${userKey}_${filterKey}`;
    
    console.log(`   - Cache key: ${cacheKey}`);
    
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.incidentCache.has(cacheKey)) {
      console.log(`✅ Returning cached data with ${returnAllData ? 'NO' : 'client-side'} pagination`);
      const allIncidents = this.incidentCache.get(cacheKey)!;
      
      if (returnAllData) {
        // Return ALL incidents without pagination for client-side handling
        return {
          data: allIncidents,
          totalCount: allIncidents.length,
          hasMore: false,
          currentPage: 1,
          totalPages: 1
        };
      } else {
        // Apply client-side pagination (for backward compatibility)
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = allIncidents.slice(startIndex, endIndex);
        const totalPages = Math.ceil(allIncidents.length / pageSize);
        
        return {
          data: paginatedData,
          totalCount: allIncidents.length,
          hasMore: page < totalPages,
          currentPage: page,
          totalPages
        };
      }
    }

    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      console.log('⚠️ Request already in progress, returning cached or empty data');
      const cachedData = this.incidentCache.get(cacheKey) || [];
      
      if (returnAllData) {
        return {
          data: cachedData,
          totalCount: cachedData.length,
          hasMore: false,
          currentPage: 1,
          totalPages: 1
        };
      } else {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = cachedData.slice(startIndex, endIndex);
        const totalPages = Math.ceil(cachedData.length / pageSize);
        
        return {
          data: paginatedData,
          totalCount: cachedData.length,
          hasMore: page < totalPages,
          currentPage: page,
          totalPages
        };
      }
    }

    this.isLoading = true;

    try {
      console.log('🚀 Invoking fetch-incidents edge function...');
      const { data, error } = await supabase.functions.invoke('fetch-incidents', {
        body: {
          clientId,
          employeeId: employeeData.id,
          isSuperAdmin: employeeData.isSuperAdmin === true || hasIncidentAdmin === true,
          page,
          pageSize,
          search: filters.search || '',
          category: filters.category || '',
          subcategory: filters.subcategory || '',
          status: filters.status || '',
          priority: filters.priority || '',
          location: filters.location || ''
        },
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Failed to fetch incidents from edge function: ${error.message}`);
      }

      const incidents = data?.incidents || [];
      const totalCount = data?.totalCount || 0;
      console.log(`✅ Edge function returned ${incidents.length} incidents (Total matching: ${totalCount})`);

      const transformedIncidents: IncidentRecord[] = incidents.map((inc: any) => ({
        id: inc.id,
        ticket_id: inc.ticket_id,
        type: inc.incident_report_types?.name || 'Unknown',
        category: inc.incident_categories?.name || 'Unknown',
        subcategory: inc.incident_subcategories?.name || '',
        description: inc.description || '',
        root_cause: inc.root_cause_analysis ?? null,
        learning_points: inc.learning_points ?? null,
        action_taken: inc.action_taken ?? null,
        peopleInvolved: Array.isArray(inc.people_involved) ? inc.people_involved : [],
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
        updatedAt: new Date(inc.updated_at),
        recommended_action: inc.recommended_action || null
      }));

      const isSuperAdmin = employeeData.isSuperAdmin === true;

      // Cache ALL the results
      this.incidentCache.set(cacheKey, transformedIncidents);
      console.log(`💾 Cached ${transformedIncidents.length} incidents with key: ${cacheKey}`);

      if (returnAllData) {
        // Return ALL incidents without pagination for client-side handling
        const response: PaginatedResponse<IncidentRecord> = {
          data: transformedIncidents,
          totalCount: totalCount,
          hasMore: totalCount > (page * pageSize),
          currentPage: page,
          totalPages: Math.ceil(totalCount / pageSize),
          config: data.config // Include consolidated config data
        };

        console.log(`📋 Returning incidents and config for page ${page}`);
        return response;
      } else {
        // Apply client-side pagination (for backward compatibility)
        const totalPages = Math.ceil(totalCount / pageSize);
        const hasMore = page < totalPages;

        const response: PaginatedResponse<IncidentRecord> = {
          data: transformedIncidents,
          totalCount: totalCount,
          hasMore,
          currentPage: page,
          totalPages,
          config: data.config // Include consolidated config data
        };

        return response;
      }

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
    // Delegate to the new method with empty filters and pagination enabled
    return this.fetchIncidentsForClientWithFilters(
      clientId,
      forceRefresh,
      employeeData,
      hasIncidentAdmin,
      pagination,
      {},
      false // Keep pagination for backward compatibility
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

      // Apply same improved filtering logic for stats
      const isSuperAdmin = employeeData.isSuperAdmin === true;
      
      if (isSuperAdmin) {
        // Super admin can see all incidents
        console.log('Stats: Super admin access - all incidents');
      } else if (hasIncidentAdmin) {
        // Incident admin can see all incidents for the client
        console.log('Stats: Incident admin access - all incidents');
      } else {
        // Regular users can only see incidents they created or are assigned to
        query = query.or(`created_by.eq.${employeeData.id},assigned_to.eq.${employeeData.id}`);
        console.log('Stats: Regular user access - filtered incidents');
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
