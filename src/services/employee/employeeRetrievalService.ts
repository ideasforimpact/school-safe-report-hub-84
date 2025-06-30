import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee, VerificationDocument } from '@/types/employeeVerification';

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
    
    // SECURITY: Always filter by client_id to prevent cross-client data access
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        employee_documents (
          id,
          verification_status,
          document_type_id,
          document_url,
          document_number,
          created_at,
          updated_at
        )
      `)
      .eq('client_id', clientId); // MANDATORY client_id filter

    if (error) {
      console.error("Error fetching employees:", error);
      // Don't show toast error for this, just log it and return empty array
      console.log("Failed to fetch employees, returning empty array");
      return [];
    }

    console.log(`Successfully fetched ${data?.length || 0} employees from API for client: ${clientId}`);
    
    // Map the database records to our Employee model
    const employees = (data || []).map(record => {
      // Map employee documents to our VerificationDocument interface
      const documents: VerificationDocument[] = (record.employee_documents || []).map(doc => ({
        id: doc.id,
        employeeId: record.id,
        documentTypeId: doc.document_type_id || '',
        documentTypeName: 'Unknown', // Will be populated by the component if needed
        documentNumber: doc.document_number || '',
        documentImage: doc.document_url || '',
        verificationStatus: (doc.verification_status as VerificationDocument['verificationStatus']) || 'pending',
        verificationMethod: 'manual' as const,
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
        phone: '',
        dateOfBirth: '',
        address: '',
        joiningDate: record.joining_date || new Date().toISOString(),
        department: record.department || '',
        position: record.employee_type || '',
        employeeType: (record.employee_type as Employee['employeeType']) || 'permanent',
        status: record.status === true,
        createdAt: record.created_at || new Date().toISOString(),
        updatedAt: record.updated_at || new Date().toISOString(),
        isSuperAdmin: record?.is_super_admin,
        documents: documents,
        clientId: record.client_id
      };
      return employee;
    });
    
    return employees;
  } catch (error) {
    console.error("Error in getAllEmployeesFromApi:", error);
    // Don't show toast error, just return empty array
    return [];
  }
};

export const getEmployeeByIdFromApi = async (id: string, clientId?: string): Promise<Employee | null> => {
  try {
    // Build query with mandatory client_id filter if provided
    let query = supabase
      .from('employees')
      .select('*')
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
      phone: '',
      dateOfBirth: '',
      address: '',
      joiningDate: data.joining_date || new Date().toISOString(),
      department: data.department || '',
      position: data.employee_type || '',
      employeeType: (data.employee_type as Employee['employeeType']) || 'permanent',
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
      .select('*')
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
      department: data.department || '',
      position: data.employee_type || '',
      employeeType: (data.employee_type as Employee['employeeType']) || 'permanent',
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
