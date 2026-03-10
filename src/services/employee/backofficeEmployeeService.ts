
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
  clientName?: string; // Optional client name for display
  createdAt?: string; // Employee creation date
  documentsSummary: {
    total: number;
    verified: number;
    pending: number;
    inProgress?: number;
    failed: number;
  };
}

export const backofficeEmployeeService = {
  async fetchAllClients(): Promise<BackofficeClient[]> {
    try {
      console.log('🔍 Fetching active clients via edge function...');
      
      // Use edge function with service role to bypass RLS issues
      const { data, error } = await supabase.functions.invoke('backoffice-client-management', {
        body: { action: 'fetchAllClients' }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch clients');
      }

      console.log('✅ Successfully received active clients:', data.data?.length || 0);
      return data.data || [];
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

      console.log('🔍 Fetching employees with manual documents for client via edge function:', clientId);
      
      // Use edge function with service role to bypass RLS issues
      const { data, error } = await supabase.functions.invoke('backoffice-client-management', {
        body: { action: 'fetchEmployeesByClient', clientId }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch employees');
      }

      console.log('✅ Successfully received employees with manual documents:', data.data?.length || 0);
      return data.data || [];
    } catch (error) {
      console.error('Error in fetchEmployeesByClient:', error);
      throw error;
    }
  },

  async fetchAllEmployees(): Promise<EmployeeWithDocumentsSummary[]> {
    try {
      console.log('🔍 Fetching all employees with manual documents via edge function');
      
      // Use edge function with service role to bypass RLS issues
      const { data, error } = await supabase.functions.invoke('backoffice-client-management', {
        body: { action: 'fetchAllEmployees' }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch employees');
      }

      console.log('✅ Successfully received all employees with manual documents:', data.data?.length || 0);
      return data.data || [];
    } catch (error) {
      console.error('Error in fetchAllEmployees:', error);
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
          documents_files,
          comments,
          document_number,
          verification_status,
          api_verification_status,
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
        .eq('employee_id', employeeId)
        .eq('is_delete', 0);

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
      }

      const documentIds = ((documentsData as any[]) || []).map(doc => doc.id).filter(Boolean);
      let auditByDocumentId = new Map<string, { both_fallback: boolean | null; latest_status_code: number | null }>();

      if (documentIds.length > 0) {
        const { data: auditData, error: auditError } = await supabase
          .from('employee_verification_audit_log')
          .select('document_id, both_fallback, latest_status_code')
          .in('document_id', documentIds);

        if (auditError) {
          console.error('Error fetching employee verification audit logs:', auditError);
        } else {
          auditByDocumentId = new Map(
            (auditData || []).map((row: any) => [
              row.document_id,
              {
                both_fallback: row.both_fallback ?? null,
                latest_status_code: row.latest_status_code ?? null
              }
            ])
          );
        }
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
        documents: ((documentsData as any[]) || []).map(doc => {
          let documentUrl = doc.document_url;
          
          // If document_url is a storage path, convert to full URL
          if (documentUrl && !documentUrl.startsWith('data:') && !documentUrl.startsWith('https://')) {
            {
              const base = (import.meta as any).env?.VITE_SUPABASE_PUBLIC_STORAGE_BASE_URL;
              const normalizedBase = base.replace(/\/$/, '');
              documentUrl = `${normalizedBase}/employee-documents/${documentUrl}`;
            }
          }
          
          return {
            id: doc.id,
            employeeId: doc.employee_id,
            documentTypeId: doc.document_type_id || '',
            documentTypeName: doc.document_type?.name || 'Unknown',
            documentNumber: doc.document_number || '',
            documentImage: documentUrl,
            // Pass-through files array for backoffice Files dialog
            documents_files: Array.isArray((doc as any).documents_files) ? (doc as any).documents_files : [],
            comments: Array.isArray((doc as any).comments) ? (doc as any).comments : [],
            verificationStatus: doc.verification_status as 'verified' | 'failed' | 'pending' | 'in-progress' | 'completed' | 'rejected' || 'pending',
            apiVerificationStatus: (doc as any).api_verification_status as 'pending' | 'completed' | 'failed' | null,
            bothFallback: auditByDocumentId.get(doc.id)?.both_fallback ?? undefined,
            latestStatusCode: auditByDocumentId.get(doc.id)?.latest_status_code ?? undefined,
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
