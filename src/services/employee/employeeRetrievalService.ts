
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee, VerificationDocument } from '@/types/employeeVerification';

export const getAllEmployeesFromApi = async (clientId?: string | null): Promise<Employee[]> => {
  try {
    console.log("Calling getAllEmployeesFromApi with clientId:", clientId);
    
    // Simple query to employees table
    const query = supabase.from('employees').select('*');
    
    // Apply client_id filter if provided
    if (clientId) {
      query.eq('client_id', clientId);
      console.log(`Filtering employees by client_id: ${clientId}`);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching employees:", error);
      // Don't show toast error for this, just log it
      console.log("Failed to fetch employees, returning empty array");
      return [];
    }

    console.log(`Successfully fetched ${data?.length || 0} employees from API`);
    
    // Map the database records to our Employee model
    const employees = (data || []).map(record => {
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
        documents: [],
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

export const getEmployeeByIdFromApi = async (id: string): Promise<Employee | null> => {
  try {
    // Use maybeSingle to avoid errors when no employee is found
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .maybeSingle();

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
      documents: []
    };
    
    return employee;
  } catch (error) {
    console.error("Error in getEmployeeByIdFromApi:", error);
    return null;
  }
};

export const getEmployeeByUserIdFromApi = async (userId: string): Promise<Employee | null> => {
  try {
    // Use maybeSingle to avoid errors when no employee is found
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
      documents: []
    };
  } catch (error) {
    console.error("Error in getEmployeeByUserIdFromApi:", error);
    return null;
  }
};
