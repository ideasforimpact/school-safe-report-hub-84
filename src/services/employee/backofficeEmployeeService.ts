
import { supabase } from '@/integrations/supabase/client';

export interface BackofficeClient {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

export interface EmployeeWithDocumentsSummary {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  position: string;
  clientId: string;
  documentsSummary: {
    total: number;
    verified: number;
    pending: number;
    failed: number;
  };
}

export const backofficeEmployeeService = {
  async fetchAllClients(): Promise<BackofficeClient[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, active')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchAllClients:', error);
      throw error;
    }
  },

  async fetchEmployeesByClient(clientId: string): Promise<EmployeeWithDocumentsSummary[]> {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // SECURITY: Always filter by client_id
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, employee_id, first_name, last_name, email, department, employee_type, client_id')
        .eq('client_id', clientId)
        .eq('status', true)
        .order('first_name');

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }

      // Fetch document summaries for all employees
      const employeeIds = employees?.map(emp => emp.id) || [];
      
      let documentSummaries: Record<string, any> = {};
      
      if (employeeIds.length > 0) {
        const { data: documents, error: documentsError } = await supabase
          .from('employee_documents')
          .select('employee_id, verification_status')
          .in('employee_id', employeeIds);

        if (documentsError) {
          console.error('Error fetching document summaries:', documentsError);
          // Continue without document summaries if there's an error
        } else {
          // Group documents by employee_id and calculate summaries
          documentSummaries = (documents || []).reduce((acc, doc) => {
            if (!acc[doc.employee_id]) {
              acc[doc.employee_id] = { total: 0, verified: 0, pending: 0, failed: 0 };
            }
            
            acc[doc.employee_id].total++;
            
            switch (doc.verification_status) {
              case 'verified':
              case 'completed':
                acc[doc.employee_id].verified++;
                break;
              case 'pending':
              case 'in-progress':
                acc[doc.employee_id].pending++;
                break;
              case 'failed':
              case 'rejected':
                acc[doc.employee_id].failed++;
                break;
            }
            
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Map employees with document summaries
      const result: EmployeeWithDocumentsSummary[] = (employees || []).map(emp => ({
        id: emp.id,
        employeeId: emp.employee_id || '',
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email || '',
        department: emp.department || '',
        position: emp.employee_type || '',
        clientId: emp.client_id,
        documentsSummary: documentSummaries[emp.id] || { total: 0, verified: 0, pending: 0, failed: 0 }
      }));

      return result;
    } catch (error) {
      console.error('Error in fetchEmployeesByClient:', error);
      throw error;
    }
  }
};
