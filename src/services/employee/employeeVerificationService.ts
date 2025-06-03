
import { supabase } from '@/integrations/supabase/client';
import { Employee, VerificationDocument } from '@/types/employeeVerification';

export interface EmployeeVerificationDetails {
  employee: Employee | null;
  documents: VerificationDocument[];
}

export const getEmployeeVerificationDetails = async (employeeId: string): Promise<EmployeeVerificationDetails> => {
  try {
    console.log('Fetching employee verification details for ID:', employeeId);
    
    // Fetch employee details
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
      .maybeSingle();

    if (employeeError) {
      console.error('Error fetching employee:', employeeError);
      return { employee: null, documents: [] };
    }

    if (!employeeData) {
      console.log('No employee found with ID:', employeeId);
      return { employee: null, documents: [] };
    }

    // Map employee data to Employee type
    const employee: Employee = {
      id: employeeData.id,
      employeeId: employeeData.employee_id || '',
      name: `${employeeData.first_name} ${employeeData.last_name}`,
      firstName: employeeData.first_name,
      lastName: employeeData.last_name,
      email: employeeData.email || '',
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
      documents: []
    };

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
        created_at,
        updated_at,
        document_type:employee_document_type(name, description),
        document_status:document_status(name, description)
      `)
      .eq('employee_id', employeeId);

    if (documentsError) {
      console.error('Error fetching employee documents:', documentsError);
      return { employee, documents: [] };
    }

    // Map documents data to VerificationDocument type
    const documents: VerificationDocument[] = (documentsData || []).map(doc => ({
      id: doc.id,
      employeeId: doc.employee_id,
      documentTypeId: doc.document_type_id || '',
      documentTypeName: doc.document_type?.name || 'Unknown',
      documentNumber: doc.document_number || '',
      documentImage: doc.document_url,
      verificationStatus: (doc.verification_status as 'verified' | 'failed' | 'pending') || 'pending',
      documentStatusId: doc.document_status_id,
      documentStatusName: doc.document_status?.name,
      verificationDate: null,
      verificationNotes: '',
      verificationMethod: 'manual',
      employee_docs_log: doc.employee_docs_log || [],
      params: doc.params || {},
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    }));

    console.log(`Successfully fetched employee and ${documents.length} documents`);
    
    return { employee, documents };
  } catch (error) {
    console.error('Error in getEmployeeVerificationDetails:', error);
    return { employee: null, documents: [] };
  }
};

export const getEmployeeDocumentsByTimeframe = async (employeeId: string, timeframe?: string): Promise<VerificationDocument[]> => {
  try {
    console.log('Fetching employee documents for ID:', employeeId, 'with timeframe:', timeframe || 'all');
    
    let query = supabase
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
        created_at,
        updated_at,
        document_type:employee_document_type(name, description),
        document_status:document_status(name, description)
      `)
      .eq('employee_id', employeeId);

    // Apply timeframe filter if provided
    if (timeframe) {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case '7':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employee documents:', error);
      return [];
    }

    // Map documents data to VerificationDocument type
    const documents: VerificationDocument[] = (data || []).map(doc => ({
      id: doc.id,
      employeeId: doc.employee_id,
      documentTypeId: doc.document_type_id || '',
      documentTypeName: doc.document_type?.name || 'Unknown',
      documentNumber: doc.document_number || '',
      documentImage: doc.document_url,
      verificationStatus: (doc.verification_status as 'verified' | 'failed' | 'pending') || 'pending',
      documentStatusId: doc.document_status_id,
      documentStatusName: doc.document_status?.name,
      verificationDate: null,
      verificationNotes: '',
      verificationMethod: 'manual',
      employee_docs_log: doc.employee_docs_log || [],
      params: doc.params || {},
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    }));

    console.log(`Fetched ${documents.length} documents for timeframe: ${timeframe || 'all'}`);
    return documents;
  } catch (error) {
    console.error('Error in getEmployeeDocumentsByTimeframe:', error);
    return [];
  }
};
