import { supabase } from '@/integrations/supabase/client';
import { IncidentRecord } from '@/services/incidentService';
import type { Json } from '@/integrations/supabase/types';

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
  config?: Record<string, unknown>; // New field for consolidated config data
}

// Shape of an incident row as returned by the fetch-incidents edge function
interface IncidentEdgeRow {
  id: string;
  ticket_id: string;
  description?: string;
  root_cause_analysis?: string | null;
  learning_points?: string | null;
  action_taken?: string | null;
  people_involved?: unknown[];
  date: string;
  reopen?: number;
  created_at: string;
  updated_at: string;
  recommended_action?: Json | null;
  incident_report_types?: { name?: string } | null;
  incident_categories?: { name?: string } | null;
  incident_subcategories?: { name?: string } | null;
  campuses?: { name?: string } | null;
  facilities?: { name?: string } | null;
  incident_status?: { name?: string } | null;
  incident_priorities?: { name?: string } | null;
  created_by_employee?: { id?: string; first_name?: string; last_name?: string } | null;
  assigned_employee?: { id?: string; first_name?: string; last_name?: string } | null;
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

  private async getCategoryId(clientId: string, categoryName: string, clientTypeId?: string): Promise<string | null> {
    try {
      let query = supabase
        .from('incident_categories')
        .select('id')
        .eq('name', categoryName)
        .eq('client_id', clientId);

      if (clientTypeId) {
        query = query.eq('client_type_id', clientTypeId);
      }

      const { data, error } = await query.maybeSingle();

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

  private async getSubcategoryId(clientId: string, subcategoryName: string, clientTypeId?: string): Promise<string | null> {
    try {
      let query = supabase
        .from('incident_subcategories')
        .select('id')
        .eq('name', subcategoryName)
        .eq('client_id', clientId);

      if (clientTypeId) {
        query = query.eq('client_type_id', clientTypeId);
      }

      const { data, error } = await query.maybeSingle();

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

  private async getPriorityId(clientId: string, priorityName: string, clientTypeId?: string): Promise<string | null> {
    try {
      let query = supabase
        .from('incident_priorities')
        .select('id')
        .eq('name', priorityName)
        .eq('client_id', clientId);

      if (clientTypeId) {
        query = query.eq('client_type_id', clientTypeId);
      }

      const { data, error } = await query.maybeSingle();

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

  private async getLocationId(clientId: string, locationName: string, clientTypeId?: string): Promise<string | null> {
    try {
      let query = supabase
        .from('campuses')
        .select('id')
        .eq('name', locationName)
        .eq('client_id', clientId);

      if (clientTypeId) {
        query = query.eq('client_type_id', clientTypeId);
      }

      const { data, error } = await query.maybeSingle();

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

  private async getFacilityId(clientId: string, facilityName: string, clientTypeId?: string): Promise<string | null> {
    try {
      let query = supabase
        .from('facilities')
        .select('id')
        .eq('name', facilityName)
        .eq('client_id', clientId);

      if (clientTypeId) {
        query = query.eq('client_type_id', clientTypeId);
      }

      const { data, error } = await query.maybeSingle();

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
    employeeData?: Record<string, unknown>,
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
    
    // Cache key includes page/pageSize — the server (fetch-incidents edge function)
    // paginates with .range(), so each cache entry only ever holds ONE page of
    // results, never the full filtered set. Keying by page keeps entries from
    // colliding (previously page 2's 3 results got cached under the same key as
    // page 1's 10, and any later "cache hit" re-sliced that partial page as if it
    // were the complete dataset — showing page 2's rows mislabeled as page 1).
    const filterKey = JSON.stringify(filters);
    const userKey = `${employeeData.id}_${employeeData.isSuperAdmin}_${hasIncidentAdmin}`;
    const cacheKey = `${clientId}_${userKey}_${filterKey}_p${page}_s${pageSize}_all${returnAllData}`;

    console.log(`   - Cache key: ${cacheKey}`);

    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.incidentCache.has(cacheKey)) {
      console.log('✅ Returning cached page from previous fetch');
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
      console.log('🚀 Invoking fetch-incidents edge function...');
      const clientTypeId: string | undefined = employeeData?.clientType?.id;
      const { data, error } = await supabase.functions.invoke('fetch-incidents', {
        body: {
          clientId,
          employeeId: employeeData.id,
          isSuperAdmin: employeeData.isSuperAdmin === true || hasIncidentAdmin === true,
          clientTypeId,
          page,
          pageSize,
          search: filters.search || '',
          category: filters.category || '',
          subcategory: filters.subcategory || '',
          status: filters.status || '',
          priority: filters.priority || '',
          location: filters.location || '',
          facility: filters.facility || '',
          dateFrom: filters.dateFrom || '',
          dateTo: filters.dateTo || '',
          returnAllData
        },
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Failed to fetch incidents from edge function: ${error.message}`);
      }

      const incidents = data?.incidents || [];
      const totalCount = data?.totalCount || 0;
      console.log(`✅ Edge function returned ${incidents.length} incidents (Total matching: ${totalCount})`);

      const transformedIncidents: IncidentRecord[] = (incidents as IncidentEdgeRow[]).map((inc) => ({
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

      const totalPages = Math.ceil(totalCount / pageSize);
      const response: PaginatedResponse<IncidentRecord> = {
        data: transformedIncidents,
        totalCount,
        hasMore: page < totalPages,
        currentPage: page,
        totalPages,
        config: data.config // Include consolidated config data
      };

      // Cache the full response object keyed by page
      this.incidentCache.set(cacheKey, response as unknown as IncidentRecord[]);
      console.log(`💾 Cached page ${page} with ${transformedIncidents.length} incidents`);

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
    employeeData?: Record<string, unknown>,
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
    employeeData?: Record<string, unknown>,
    hasIncidentAdmin?: boolean
  ): Promise<IncidentRecord[]> {
    const response = await this.fetchIncidentsForClient(clientId, forceRefresh, employeeData, hasIncidentAdmin);
    return response.data;
  }

  private statsInflight: Map<string, Promise<{
    total: number;
    open: number;
    inProgress: number;
    closed: number;
  }>> = new Map();

  async getIncidentStats(clientId: string, employeeData?: Record<string, unknown>, hasIncidentAdmin?: boolean): Promise<{
    total: number;
    open: number;
    inProgress: number;
    closed: number;
  }> {
    // Early return if no employee data
    if (!employeeData || !employeeData.id) {
      console.log('⚠️ No employee data provided for stats, returning empty stats');
      return { total: 0, open: 0, inProgress: 0, closed: 0 };
    }

    const isSuperAdmin = employeeData.isSuperAdmin === true;
    const inflightKey = `${clientId}_${employeeData.id}_${isSuperAdmin}_${hasIncidentAdmin}`;

    const existing = this.statsInflight.get(inflightKey);
    if (existing) {
      return existing;
    }

    const request = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-incidents', {
          body: {
            operation: 'get_stats',
            clientId,
            employeeId: employeeData.id,
            isSuperAdmin,
            hasIncidentAdmin,
          },
        });

        if (error) throw error;
        if (!data?.success) throw new Error('Failed to fetch incident stats');

        return data.data as { total: number; open: number; inProgress: number; closed: number };
      } catch (error) {
        console.error('Error fetching incident stats:', error);
        return { total: 0, open: 0, inProgress: 0, closed: 0 };
      } finally {
        this.statsInflight.delete(inflightKey);
      }
    })();

    this.statsInflight.set(inflightKey, request);
    return request;
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
