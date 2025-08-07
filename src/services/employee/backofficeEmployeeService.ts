
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/employeeVerification';

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
      console.log('🔍 Fetching clients - checking auth state...');
      
      // Debug authentication state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session ? {
        user: session.user?.email,
        role: session.user?.role,
        aud: session.user?.aud
      } : 'null');
      
      if (sessionError) {
        console.error('Session error:', sessionError);
      }

      // Check if we can access the clients table
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, active')
        .eq('active', true)
        .order('name');

      console.log('Clients query result:', { 
        success: !error, 
        dataCount: data?.length || 0, 
        error: error?.message 
      });

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
  },

  async fetchEmployeeWithDocuments(employeeId: string, clientId: string): Promise<Employee | null> {
    try {
      if (!employeeId || !clientId) {
        throw new Error('Employee ID and Client ID are required');
      }

      // SECURITY: Always filter by both employee_id and client_id
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          email,
          employee_type,
          department,
          status,
          client_id,
          is_super_admin,
          user_id,
          joining_date,
          created_at,
          updated_at
        `)
        .eq('id', employeeId)
        .eq('client_id', clientId)
        .single();

      if (employeeError) {
        console.error('Error fetching employee:', employeeError);
        return null;
      }

      if (!employeeData) {
        return null;
      }

      // Fetch employee documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('employee_documents')
        .select(`
          id,
          employee_id,
          document_type_id,
          document_status_id,
          document_url,
          document_number,
          verification_status,
          params,
          employee_docs_log,
          last_otp_generated,
          cron_activate,
          cron_activated_date,
          cron_updated_date,
          cron_log,
          created_at,
          updated_at,
          document_type:employee_document_type(name, description),
          document_status:document_status(name, description)
        `)
        .eq('employee_id', employeeId);

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
      }

      // Map employee data to the expected format
      const employee: Employee = {
        id: employeeData.id,
        employeeId: employeeData.employee_id || '',
        name: `${employeeData.first_name} ${employeeData.last_name}`,
        firstName: employeeData.first_name,
        lastName: employeeData.last_name,
        email: employeeData.email,
        phone: '',
        dateOfBirth: '',
        address: '',
        joiningDate: employeeData.joining_date || new Date().toISOString(),
        department: employeeData.department || '',
        position: employeeData.employee_type || '',
        employeeType: (employeeData.employee_type as Employee['employeeType']) || 'permanent',
        status: employeeData.status === true,
        createdAt: employeeData.created_at || new Date().toISOString(),
        updatedAt: employeeData.updated_at || new Date().toISOString(),
        clientId: employeeData.client_id,
        isSuperAdmin: employeeData.is_super_admin,
        documents: (documentsData || []).map(doc => {
          let documentUrl = doc.document_url;
          
          // If document_url is a storage path, convert to full URL
          if (documentUrl && !documentUrl.startsWith('data:') && !documentUrl.startsWith('https://')) {
            documentUrl = `https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public/employee-documents/${documentUrl}`;
          }
          
          return {
            id: doc.id,
            employeeId: doc.employee_id,
            documentTypeId: doc.document_type_id || '',
            documentTypeName: doc.document_type?.name || 'Unknown',
            documentNumber: doc.document_number || '',
            documentImage: documentUrl,
            verificationStatus: doc.verification_status as 'verified' | 'failed' | 'pending' | 'in-progress' | 'completed' | 'rejected' || 'pending',
            documentStatusId: doc.document_status_id,
            documentStatusName: doc.document_status?.name,
            verificationDate: undefined,
            verificationNotes: '',
            verificationMethod: 'manual' as const,
            employee_docs_log: Array.isArray(doc.employee_docs_log) ? doc.employee_docs_log as Array<{
              timestamp: string;
              action: string;
              response: any;
              notes?: string;
            }> : [],
            params: typeof doc.params === 'object' && doc.params !== null ? doc.params as { [key: string]: any; DOB?: string; } : {},
            cronActivate: doc.cron_activate || false,
            cronActivatedDate: doc.cron_activated_date || undefined,
            cronUpdatedDate: doc.cron_updated_date || undefined,
            cronLog: Array.isArray(doc.cron_log) ? doc.cron_log as Array<{
              timestamp: string;
              action: string;
              status: string;
              details?: any;
              error?: string;
            }> : [],
            createdAt: doc.created_at,
            updatedAt: doc.updated_at
          };
        })
      };

      return employee;
    } catch (error) {
      console.error('Error in fetchEmployeeWithDocuments:', error);
      return null;
    }
  }
};
