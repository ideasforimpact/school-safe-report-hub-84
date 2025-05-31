import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee, VerificationDocument } from '@/types/employeeVerification';

export const getAllEmployeesFromApi = async (clientId?: string | null): Promise<Employee[]> => {
  try {
    console.log("Calling getAllEmployeesFromApi with clientId:", clientId);
    // Fetch all employees with optional client_id filter
    const query = supabase.from('employees').select('*');
    
    // Apply client_id filter if provided
    if (clientId) {
      query.eq('client_id', clientId);
      console.log(`Filtering employees by client_id: ${clientId}`);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
      throw error;
    }

    console.log(`Successfully fetched ${data.length} employees from API ${clientId ? 'for client ' + clientId : 'across all clients'}`);
    
    // Map the database records to our Employee model
    const employees = data.map(record => {
      // Create a base employee with all required fields
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
        position: record.employee_type || '', // Use employee_type as position since it doesn't exist
        employeeType: (record.employee_type as Employee['employeeType']) || 'permanent',
        status: record.status === true, // Convert to boolean
        createdAt: record.created_at || new Date().toISOString(),
        updatedAt: record.updated_at || new Date().toISOString(),
        isSuperAdmin: record?.is_super_admin, // Correctly mapping from DB's is_super_admin to type's isSuperAdmin
        documents: [], // Initialize empty documents array
        clientId: record.client_id // Add clientId to employee data
      };
      return employee;
    });
    
    // Now fetch documents for each employee
    const employeesWithDocs = await Promise.all(
      employees.map(async (employee) => {
        try {
          const { data: docs, error: docsError } = await supabase
            .from('employee_documents')
            .select('*')
            .eq('employee_id', employee.id);
            
          if (!docsError && docs) {
            // Add the documents to the employee object
            const mappedDocs: VerificationDocument[] = docs.map(doc => ({
              id: doc.id,
              employeeId: doc.employee_id,
              documentTypeId: doc.document_type_id,
              documentNumber: doc.document_number || '',
              documentImage: doc.document_url ? 
                `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${doc.document_url}` : '',
              verificationStatus: doc.verification_status as 'pending' | 'verified' | 'failed' || 'pending',
              documentStatusId: doc.document_status_id,
              // Properly cast employee_docs_log to match the expected type
              employee_docs_log: Array.isArray(doc.employee_docs_log) ? 
                doc.employee_docs_log.map((log: any) => ({
                  timestamp: log.timestamp || '',
                  action: log.action || '',
                  response: log.response || {},
                  notes: log.notes || ''
                })) : [],
              createdAt: doc.created_at || new Date().toISOString(),
              updatedAt: doc.updated_at || new Date().toISOString()
            }));
            
            employee.documents = mappedDocs;
          }
        } catch (docError) {
          console.error(`Error fetching documents for employee ${employee.id}:`, docError);
        }
        return employee;
      })
    );
    
    return employeesWithDocs;
  } catch (error) {
    console.error("Error in getAllEmployeesFromApi:", error);
    toast.error("Failed to fetch employees");
    throw error;
  }
};

export const getEmployeeByIdFromApi = async (id: string): Promise<Employee> => {
  try {
    // Fetch a single employee by ID
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching employee:", error);
      toast.error("Failed to fetch employee");
      throw error;
    }

    // Convert the response to our Employee type with all required fields
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
    
    // Fetch documents separately
    try {
      const { data: docs, error: docsError } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', id);
        
      if (!docsError && docs) {
        // Add the documents to the employee object
        const mappedDocs: VerificationDocument[] = docs.map(doc => ({
          id: doc.id,
          employeeId: doc.employee_id,
          documentTypeId: doc.document_type_id,
          documentNumber: doc.document_number || '',
          documentImage: doc.document_url ? 
            `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${doc.document_url}` : '',
          verificationStatus: doc.verification_status as 'pending' | 'verified' | 'failed' || 'pending',
          documentStatusId: doc.document_status_id,
          // Properly cast employee_docs_log to match the expected type
          employee_docs_log: Array.isArray(doc.employee_docs_log) ? 
            doc.employee_docs_log.map((log: any) => ({
              timestamp: log.timestamp || '',
              action: log.action || '',
              response: log.response || {},
              notes: log.notes || ''
            })) : [],
          createdAt: doc.created_at || new Date().toISOString(),
          updatedAt: doc.updated_at || new Date().toISOString()
        }));
        
        employee.documents = mappedDocs;
      }
    } catch (docError) {
      console.error(`Error fetching documents for employee ${id}:`, docError);
    }
    
    return employee;
  } catch (error) {
    console.error("Error in getEmployeeByIdFromApi:", error);
    toast.error("Failed to fetch employee");
    throw error;
  }
};

export const getEmployeeByUserIdFromApi = async (userId: string): Promise<Employee> => {
  try {
    // Fetch a single employee by user ID
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error("Error fetching employee by user ID:", error);
      toast.error("Failed to fetch employee");
      throw error;
    }

    // Convert the response to our Employee type with all required fields
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
    toast.error("Failed to fetch employee");
    throw error;
  }
};
