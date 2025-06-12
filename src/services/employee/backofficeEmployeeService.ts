
import { supabase } from '@/integrations/supabase/client';
import { Employee, VerificationDocument } from '@/types/employeeVerification';

export interface EmployeeWithDocumentsSummary extends Employee {
  documentsSummary: {
    verified: number;
    pending: number;
    failed: number;
    total: number;
  };
}

export interface BackofficeClient {
  id: string;
  name: string;
  active: boolean;
}

export const backofficeEmployeeService = {
  // Fetch all active clients for the dropdown
  async fetchAllClients(): Promise<BackofficeClient[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, active')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching clients:', error);
        throw new Error(`Failed to fetch clients: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchAllClients:', error);
      throw error;
    }
  },

  // Fetch employees by client with document summary
  async fetchEmployeesByClient(clientId: string): Promise<EmployeeWithDocumentsSummary[]> {
    try {
      // First fetch employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          department,
          employee_type,
          status,
          joining_date,
          created_at,
          updated_at,
          client_id
        `)
        .eq('client_id', clientId)
        .order('first_name', { ascending: true });

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw new Error(`Failed to fetch employees: ${employeesError.message}`);
      }

      if (!employees || employees.length === 0) {
        return [];
      }

      // Fetch document summaries for all employees
      const employeeIds = employees.map(emp => emp.id);
      const { data: documents, error: documentsError } = await supabase
        .from('employee_documents')
        .select('employee_id, verification_status')
        .in('employee_id', employeeIds);

      if (documentsError) {
        console.error('Error fetching document summaries:', documentsError);
        // Continue without document summaries rather than failing completely
      }

      // Map employees with document summaries
      const employeesWithSummary: EmployeeWithDocumentsSummary[] = employees.map(employee => {
        const employeeDocs = documents?.filter(doc => doc.employee_id === employee.id) || [];
        
        const verified = employeeDocs.filter(doc => doc.verification_status === 'verified').length;
        const pending = employeeDocs.filter(doc => doc.verification_status === 'pending').length;
        const failed = employeeDocs.filter(doc => doc.verification_status === 'failed').length;
        const total = employeeDocs.length;

        return {
          ...employee,
          name: `${employee.first_name} ${employee.last_name}`,
          employeeId: employee.employee_id,
          dateOfBirth: undefined,
          address: undefined,
          phone: undefined,
          position: employee.department, // Use department as position for now
          joiningDate: employee.joining_date,
          employeeType: employee.employee_type as 'permanent' | 'contract' | 'temporary' | 'part_time' | 'consultant' | 'intern',
          createdAt: employee.created_at,
          updatedAt: employee.updated_at,
          documentsSummary: {
            verified,
            pending,
            failed,
            total
          }
        };
      });

      return employeesWithSummary;
    } catch (error) {
      console.error('Error in fetchEmployeesByClient:', error);
      throw error;
    }
  },

  // Fetch employee details with documents
  async fetchEmployeeWithDocuments(employeeId: string, clientId: string): Promise<Employee | null> {
    try {
      // Fetch employee details
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          department,
          employee_type,
          status,
          joining_date,
          created_at,
          updated_at,
          client_id
        `)
        .eq('id', employeeId)
        .eq('client_id', clientId)
        .single();

      if (employeeError) {
        console.error('Error fetching employee:', employeeError);
        throw new Error(`Failed to fetch employee: ${employeeError.message}`);
      }

      if (!employee) {
        return null;
      }

      // Fetch employee documents
      const { data: documents, error: documentsError } = await supabase
        .from('employee_documents')
        .select(`
          id,
          employee_id,
          document_type_id,
          document_number,
          document_url,
          verification_status,
          document_status_id,
          created_at,
          updated_at,
          employee_docs_log,
          params,
          cron_activate,
          cron_activated_date,
          cron_updated_date,
          cron_log
        `)
        .eq('employee_id', employeeId);

      if (documentsError) {
        console.error('Error fetching employee documents:', documentsError);
        // Continue without documents rather than failing
      }

      // Map documents to VerificationDocument format
      const mappedDocuments: VerificationDocument[] = (documents || []).map(doc => ({
        id: doc.id,
        employeeId: doc.employee_id,
        documentTypeId: doc.document_type_id || '',
        documentNumber: doc.document_number || '',
        documentImage: doc.document_url,
        verificationStatus: (doc.verification_status as 'pending' | 'verified' | 'failed') || 'pending',
        documentStatusId: doc.document_status_id || undefined,
        employee_docs_log: Array.isArray(doc.employee_docs_log) ? 
          doc.employee_docs_log as Array<{timestamp: string; action: string; response: any; notes?: string}> : [],
        params: doc.params || {},
        cronActivate: doc.cron_activate || false,
        cronActivatedDate: doc.cron_activated_date || undefined,
        cronUpdatedDate: doc.cron_updated_date || undefined,
        cronLog: Array.isArray(doc.cron_log) ? 
          doc.cron_log as Array<{timestamp: string; action: string; status: string; details?: any; error?: string}> : [],
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }));

      return {
        ...employee,
        name: `${employee.first_name} ${employee.last_name}`,
        employeeId: employee.employee_id,
        dateOfBirth: undefined,
        address: undefined,
        phone: undefined,
        position: employee.department, // Use department as position for now
        joiningDate: employee.joining_date,
        employeeType: employee.employee_type as 'permanent' | 'contract' | 'temporary' | 'part_time' | 'consultant' | 'intern',
        createdAt: employee.created_at,
        updatedAt: employee.updated_at,
        documents: mappedDocuments,
        firstName: employee.first_name,
        lastName: employee.last_name
      };
    } catch (error) {
      console.error('Error in fetchEmployeeWithDocuments:', error);
      throw error;
    }
  }
};
