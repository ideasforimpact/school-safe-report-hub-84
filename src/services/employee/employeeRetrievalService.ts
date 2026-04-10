
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee, VerificationDocument } from '@/types/employeeVerification';
import { getBatchEmployeeSOPStatistics } from '@/services/sop/sopStatisticsService';

export interface EmployeeListFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  departmentId?: string;
  joiningDateFrom?: string;
  joiningDateTo?: string;
  /** When false, skip the employee_documents follow-up query (one HTTP round-trip less). Default true. */
  includeDocuments?: boolean;
}

export interface PaginatedEmployeesResult {
  employees: Employee[];
  total: number;
}

export interface GetPaginatedEmployeesOptions {
  signal?: AbortSignal;
}

const mapEmployeeRecords = (
  employeesData: any[],
  documentsData: any[] = []
): Employee[] => {
  return employeesData.map(record => {
    const employeeDocuments = (documentsData || []).filter(doc => doc.employee_id === record.id);

    const documents: VerificationDocument[] = employeeDocuments.map(doc => ({
      id: doc.id,
      employeeId: record.id,
      documentTypeId: doc.document_type_id || '',
      documentTypeName: (doc.document_type as any)?.name || 'Unknown',
      documentNumber: doc.document_number || '',
      documentImage: doc.document_url || '',
      verificationStatus: (doc.verification_status as VerificationDocument['verificationStatus']) || 'pending',
      verificationMethod: 'manual' as const,
      personalInfo: doc.personal_info || undefined,
      employee_docs_log: [],
      params: {},
      cronActivate: false,
      createdAt: doc.created_at || new Date().toISOString(),
      updatedAt: doc.updated_at || new Date().toISOString()
    }));

    return {
      id: record.id,
      employeeId: record.employee_id || '',
      name: `${record.first_name} ${record.last_name}`,
      firstName: record.first_name,
      lastName: record.last_name,
      email: record.email || '',
      phone: (record as any).phone || '',
      designation: (record as any).designation || '',
      dateOfBirth: '',
      address: '',
      joiningDate: record.joining_date || new Date().toISOString(),
      department: (record.department as any)?.department_name || record.department || '',
      position: (record.employee_type as any)?.type_name || '',
      employeeType: (record.employee_type as any)?.type_name ?? '',
      status: record.status === true,
      createdAt: record.created_at || new Date().toISOString(),
      updatedAt: record.updated_at || new Date().toISOString(),
      isSuperAdmin: record?.is_super_admin,
      isCpdInvolved: (record as any).is_cpd_involved === true,
      documents,
      clientId: record.client_id
    } as Employee;
  });
};

export const getPaginatedEmployeesFromApi = async (
  clientId?: string | null,
  page: number = 1,
  pageSize: number = 10,
  filters: EmployeeListFilters = {},
  options?: GetPaginatedEmployeesOptions
): Promise<PaginatedEmployeesResult> => {
  try {
    if (!clientId) {
      return { employees: [], total: 0 };
    }

    const signal = options?.signal;

    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    let query = supabase
      .from('employees')
      .select('*, employee_type:employee_type(id, type_name), department:employee_departments(id, department_name)', { count: 'exact' })
      .eq('client_id', clientId);

    if (filters.status === 'active') {
      query = query.eq('status', true);
    } else if (filters.status === 'inactive') {
      query = query.eq('status', false);
    }

    if (filters.departmentId && filters.departmentId !== 'all') {
      query = query.eq('department', filters.departmentId);
    }

    if (filters.joiningDateFrom) {
      query = query.gte('joining_date', filters.joiningDateFrom);
    }

    if (filters.joiningDateTo) {
      query = query.lte('joining_date', filters.joiningDateTo);
    }

    if (filters.search?.trim()) {
      const term = filters.search.trim().replace(/[%_]/g, '');
      query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,employee_id.ilike.%${term}%`);
    }

    let employeesRequest = query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (signal) {
      employeesRequest = employeesRequest.abortSignal(signal);
    }

    const { data: employeesData, error: employeesError, count } = await employeesRequest;

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    if (employeesError) {
      console.error("Error fetching paginated employees:", employeesError);
      return { employees: [], total: 0 };
    }

    if (!employeesData || employeesData.length === 0) {
      return { employees: [], total: count || 0 };
    }

    const includeDocuments = filters.includeDocuments !== false;

    if (!includeDocuments) {
      return {
        employees: mapEmployeeRecords(employeesData, []),
        total: count || 0,
      };
    }

    const employeeIds = employeesData.map(emp => emp.id);
    let documentsRequest = (supabase as any)
      .from('employee_documents')
      .select('id, employee_id, verification_status, document_type_id, document_url, document_number, personal_info, created_at, updated_at, document_type:employee_document_type(name, description)')
      .in('employee_id', employeeIds)
      .eq('is_delete', 0);

    if (signal) {
      documentsRequest = documentsRequest.abortSignal(signal);
    }

    const { data: documentsData, error: documentsError } = await documentsRequest;

    if (documentsError) {
      console.error("Error fetching employee documents:", documentsError);
    }

    return {
      employees: mapEmployeeRecords(employeesData, documentsData || []),
      total: count || 0,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    console.error("Error in getPaginatedEmployeesFromApi:", error);
    return { employees: [], total: 0 };
  }
};

export const getAllEmployeesFromApi = async (clientId?: string | null, skipIfNoClient: boolean = true): Promise<Employee[]> => {
  try {
    console.log("Calling getAllEmployeesFromApi with clientId:", clientId);
    
    // SECURITY: Always require clientId - never fetch without it
    if (!clientId) {
      if (skipIfNoClient) {
        console.log("No clientId provided - returning empty array for security");
        return [];
      } else {
        console.error("SECURITY WARNING: getAllEmployeesFromApi called without clientId");
        throw new Error("Client ID is required for security");
      }
    }
    
    // First, fetch employees with employee_type and department joins
    const { data: employeesData, error: employeesError } = await supabase
      .from('employees')
      .select('*, employee_type:employee_type(id, type_name), department:employee_departments(id, department_name)')
      .eq('client_id', clientId); // MANDATORY client_id filter

    if (employeesError) {
      console.error("Error fetching employees:", employeesError);
      console.log("Failed to fetch employees, returning empty array");
      return [];
    }

    if (!employeesData || employeesData.length === 0) {
      console.log("No employees found for client:", clientId);
      return [];
    }

    // Then, fetch documents for all employees
    const employeeIds = employeesData.map(emp => emp.id);
    const { data: documentsData, error: documentsError } = await (supabase as any)
      .from('employee_documents')
      .select('id, employee_id, verification_status, document_type_id, document_url, document_number, personal_info, created_at, updated_at, document_type:employee_document_type(name, description)')
      .in('employee_id', employeeIds)
      .eq('is_delete', 0);

    if (documentsError) {
      console.error("Error fetching employee documents:", documentsError);
      // Continue without documents if there's an error
    }

    console.log(`Successfully fetched ${employeesData.length} employees from API for client: ${clientId}`);
    
    return mapEmployeeRecords(employeesData, documentsData || []);
  } catch (error) {
    console.error("Error in getAllEmployeesFromApi:", error);
    // Don't show toast error, just return empty array
    return [];
  }
};

export const getActiveEmployeesFromApi = async (clientId?: string | null, skipIfNoClient: boolean = true): Promise<Employee[]> => {
  try {
    console.log("Calling getActiveEmployeesFromApi with clientId:", clientId);
    
    // SECURITY: Always require clientId - never fetch without it
    if (!clientId) {
      if (skipIfNoClient) {
        console.log("No clientId provided - returning empty array for security");
        return [];
      } else {
        console.error("SECURITY WARNING: getActiveEmployeesFromApi called without clientId");
        throw new Error("Client ID is required for security");
      }
    }
    
    // First, fetch only active employees with employee_type and department joins
    const { data: employeesData, error: employeesError } = await supabase
      .from('employees')
      .select('*, employee_type:employee_type(id, type_name), department:employee_departments(id, department_name)')
      .eq('client_id', clientId) // MANDATORY client_id filter
      .eq('status', true); // Only fetch active employees

    if (employeesError) {
      console.error("Error fetching active employees:", employeesError);
      console.log("Failed to fetch active employees, returning empty array");
      return [];
    }

    if (!employeesData || employeesData.length === 0) {
      console.log("No active employees found for client:", clientId);
      return [];
    }

    // Then, fetch documents for all active employees
    const employeeIds = employeesData.map(emp => emp.id);
    const { data: documentsData, error: documentsError } = await (supabase as any)
      .from('employee_documents')
      .select('id, employee_id, verification_status, document_type_id, document_url, document_number, personal_info, created_at, updated_at, document_type:employee_document_type(name, description)')
      .in('employee_id', employeeIds)
      .eq('is_delete', 0);

    if (documentsError) {
      console.error("Error fetching employee documents:", documentsError);
      // Continue without documents if there's an error
    }

    // Fetch SOP statistics for all employees in batch
    console.log('[getActiveEmployeesFromApi] Fetching SOP statistics for', employeeIds.length, 'employees with clientId:', clientId);
    const sopStatisticsMap = await getBatchEmployeeSOPStatistics(clientId, employeeIds);
    console.log('[getActiveEmployeesFromApi] SOP statistics fetched for', sopStatisticsMap.size, 'employees');
    
    // Log a sample of stats
    if (sopStatisticsMap.size > 0) {
      const firstEntry = Array.from(sopStatisticsMap.entries())[0];
      console.log('[getActiveEmployeesFromApi] Sample stats for employee', firstEntry[0], ':', firstEntry[1]);
    }

    
    // Map the database records to our Employee model
    const employees = employeesData.map(record => {
      // Find documents for this employee
      const employeeDocuments = (documentsData || []).filter(doc => doc.employee_id === record.id);
      
      // Map employee documents to our VerificationDocument interface
      const documents: VerificationDocument[] = employeeDocuments.map(doc => ({
        id: doc.id,
        employeeId: record.id,
        documentTypeId: doc.document_type_id || '',
        documentTypeName: (doc.document_type as any)?.name || 'Unknown',
        documentNumber: doc.document_number || '',
        documentImage: doc.document_url || '',
        verificationStatus: (doc.verification_status as VerificationDocument['verificationStatus']) || 'pending',
        verificationMethod: 'manual' as const,
        personalInfo: doc.personal_info || undefined,
        employee_docs_log: [],
        params: {},
        cronActivate: false,
        createdAt: doc.created_at || new Date().toISOString(),
        updatedAt: doc.updated_at || new Date().toISOString()
      }));

      const employee: Employee = {
        id: record.id,
        employeeId: record.employee_id || '',
        name: `${record.first_name} ${record.last_name}`,
        firstName: record.first_name,
        lastName: record.last_name,
        email: record.email || '',
        phone: (record as any).phone || '',
        designation: (record as any).designation || '',
        dateOfBirth: '',
        address: '',
        joiningDate: record.joining_date || new Date().toISOString(),
        department: (record.department as any)?.department_name || record.department || '',
        position: (record.employee_type as any)?.type_name || '',
        employeeType: (record.employee_type as any)?.type_name ?? '',
        status: record.status === true,
        createdAt: record.created_at || new Date().toISOString(),
        updatedAt: record.updated_at || new Date().toISOString(),
        isSuperAdmin: record?.is_super_admin,
        isCpdInvolved: (record as any).is_cpd_involved === true,
        documents: documents,
        clientId: record.client_id,
        sopStatistics: sopStatisticsMap.get(record.id) || {
          totalSOPs: 0,
          totalSOPsSignedOff: 0,
          totalSOPsToBeDone: 0,
        }
      };
      
    
      
      return employee;
    });
    
    return employees;
  } catch (error) {
    console.error("Error in getActiveEmployeesFromApi:", error);
    // Don't show toast error, just return empty array
    return [];
  }
};

export const getEmployeeByIdFromApi = async (id: string, clientId?: string): Promise<Employee | null> => {
  try {
    // Build query with mandatory client_id filter if provided
    let query = supabase
      .from('employees')
      .select('*, employee_type:employee_type(id, type_name), department:employee_departments(id, department_name)')
      .eq('id', id);
    
    // SECURITY: Add client_id filter if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error fetching employee:", error);
      return null;
    }

    if (!data) {
      console.log("No employee found with ID:", id);
      return null;
    }

    // Convert the response to our Employee type
    const employee: Employee = {
      id: data.id,
      employeeId: data.employee_id || '',
      name: `${data.first_name} ${data.last_name}`,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email || '',
      phone: (data as any).phone || '',
      dateOfBirth: '',
      address: '',
      joiningDate: data.joining_date || new Date().toISOString(),
      department: (data.department as any)?.department_name || data.department || '',
      position: (data.employee_type as any)?.type_name || '',
      employeeType: (data.employee_type as any)?.type_name ?? '',
      status: data.status === true,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
      documents: [],
      clientId: data.client_id
    };
    
    return employee;
  } catch (error) {
    console.error("Error in getEmployeeByIdFromApi:", error);
    return null;
  }
};

export const getEmployeeByUserIdFromApi = async (userId: string, routePath?: string): Promise<Employee | null> => {
  try {
    // Skip employee fetch for routes that don't need it
    const skipRoutes = ['/', '/login', '/pricing', '/support', '/blog'];
    if (routePath && skipRoutes.includes(routePath)) {
      console.log('Skipping employee fetch for route:', routePath);
      return null;
    }

    console.log('Fetching employee by user ID:', userId);
    
    // SECURITY: Query will be automatically filtered by RLS policies
    const { data, error } = await supabase
      .from('employees')
      .select('*, employee_type:employee_type(id, type_name), department:employee_departments(id, department_name)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching employee by user ID:", error);
      return null;
    }

    if (!data) {
      console.log("No employee found for user ID:", userId);
      return null;
    }

    console.log('Found employee data:', data);

    // Convert the response to our Employee type
    return {
      id: data.id,
      employeeId: data.employee_id || '',
      name: `${data.first_name} ${data.last_name}`,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email || '',
      phone: '',
      dateOfBirth: '',
      address: '',
      joiningDate: data.joining_date || new Date().toISOString(),
      department: (data.department as any)?.department_name || data.department || '',
      position: (data.employee_type as any)?.type_name || '',
      employeeType: (data.employee_type as any)?.type_name ?? '',
      status: data.status === true,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
      documents: [],
      clientId: data.client_id
    };
  } catch (error) {
    console.error("Error in getEmployeeByUserIdFromApi:", error);
    return null;
  }
};
