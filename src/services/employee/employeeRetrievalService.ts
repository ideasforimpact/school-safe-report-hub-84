
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Employee, VerificationDocument } from '@/types/employeeVerification';
import { getBatchEmployeeSOPStatistics } from '@/services/sop/sopStatisticsService';

// Type for joined employee database rows (Supabase returns joined relations as nested objects)
type EmployeeDbRow = Record<string, unknown> & {
  employee_type?: { id?: string; type_name?: string } | null;
  department?: { id?: string; department_name?: string } | string | null;
  document_type?: { name?: string } | null;
};

type DocumentDbRow = Record<string, unknown> & {
  document_type?: { name?: string; description?: string } | null;
};

const mapEmployeeRecords = (
  employeesData: EmployeeDbRow[],
  documentsData: DocumentDbRow[] = []
): Employee[] => {
  return employeesData.map(record => {
    const employeeDocuments = (documentsData || []).filter(doc => doc.employee_id === record.id);

    const documents: VerificationDocument[] = employeeDocuments.map(doc => ({
      id: doc.id,
      employeeId: record.id,
      documentTypeId: doc.document_type_id || '',
      documentTypeName: doc.document_type?.name || 'Unknown',
      documentNumber: String(doc.document_number || ''),
      documentImage: String(doc.document_url || ''),
      verificationStatus: (doc.verification_status as VerificationDocument['verificationStatus']) || 'pending',
      verificationMethod: 'manual' as const,
      personalInfo: doc.personal_info || undefined,
      employee_docs_log: [],
      params: {},
      cronActivate: false,
      createdAt: String(doc.created_at || new Date().toISOString()),
      updatedAt: String(doc.updated_at || new Date().toISOString())
    }));

    return {
      id: record.id as string,
      employeeId: String(record.employee_id || ''),
      name: `${record.first_name} ${record.last_name}`,
      firstName: record.first_name as string,
      lastName: record.last_name as string,
      email: String(record.email || ''),
      phone: String(record.phone || ''),
      designation: String(record.designation || ''),
      dateOfBirth: '',
      address: '',
      joiningDate: String(record.joining_date || new Date().toISOString()),
      department: (record.department as { department_name?: string } | null)?.department_name || String(record.department || ''),
      position: record.employee_type?.type_name || '',
      employeeType: record.employee_type?.type_name ?? '',
      status: record.status === true,
      createdAt: String(record.created_at || new Date().toISOString()),
      updatedAt: String(record.updated_at || new Date().toISOString()),
      isSuperAdmin: record?.is_super_admin as boolean | undefined,
      isCpdInvolved: record.is_cpd_involved === true,
      documents,
      clientId: record.client_id as string
    } as Employee;
  });
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
      .select('*, employee_type:employee_type(id, type_name), department:employee_departments(id, department_name), personal_details:employee_personal_details(*), other_details:employee_other_details(*)')
      .eq('client_id', clientId) // MANDATORY client_id filter
      .eq('is_secondary_super_admin', false); // Secondary super admins are hidden from employee lists

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
    const { data: documentsData, error: documentsError } = await supabase
      .from('employee_documents' as const)
      .select('id, employee_id, verification_status, document_type_id, document_url, document_number, personal_info, created_at, updated_at, document_type:employee_document_type(name, description)')
      .in('employee_id', employeeIds)
      .eq('is_delete', 0);

    if (documentsError) {
      console.error("Error fetching employee documents:", documentsError);
      // Continue without documents if there's an error
    }

    console.log(`Successfully fetched ${employeesData.length} employees from API for client: ${clientId}`);

    // Map the database records to our Employee model
    const employees = (employeesData as EmployeeDbRow[]).map(record => {
      // Find documents for this employee
      const employeeDocuments = ((documentsData as DocumentDbRow[]) || []).filter(doc => doc.employee_id === record.id);

      // Map employee documents to our VerificationDocument interface
      const documents: VerificationDocument[] = employeeDocuments.map(doc => ({
        id: doc.id as string,
        employeeId: record.id as string,
        documentTypeId: String(doc.document_type_id || ''),
        documentTypeName: doc.document_type?.name || 'Unknown',
        documentNumber: String(doc.document_number || ''),
        documentImage: String(doc.document_url || ''),
        verificationStatus: (doc.verification_status as VerificationDocument['verificationStatus']) || 'pending',
        verificationMethod: 'manual' as const,
        personalInfo: doc.personal_info || undefined,
        employee_docs_log: [],
        params: {},
        cronActivate: false,
        createdAt: String(doc.created_at || new Date().toISOString()),
        updatedAt: String(doc.updated_at || new Date().toISOString())
      }));

      const personalDetailsRaw = record.personal_details;
      const personalDetails: Record<string, unknown> = Array.isArray(personalDetailsRaw) ? (personalDetailsRaw[0] as Record<string, unknown>) || {} : (personalDetailsRaw as Record<string, unknown>) || {};
      const otherDetailsRaw = record.other_details;
      const otherDetails: Record<string, unknown> = Array.isArray(otherDetailsRaw) ? (otherDetailsRaw[0] as Record<string, unknown>) || {} : (otherDetailsRaw as Record<string, unknown>) || {};
      const employee: Employee = {
        id: record.id as string,
        employeeId: String(record.employee_id || ''),
        name: (record.aadhar_verified_name as string) || `${record.first_name} ${record.last_name}`,
        firstName: record.first_name as string,
        lastName: record.last_name as string,
        aadharVerifiedName: (record.aadhar_verified_name as string) || undefined,
        email: String(record.email || ''),
        phone: String(record.phone || ''),
        designation: String(record.designation || ''),
        personalDetails: {
          middleName: String(personalDetails.middle_name || '') || undefined,
          fatherName: String(personalDetails.father_name || '') || undefined,
          staffId: String(personalDetails.staff_id || '') || undefined,
          experience: String(personalDetails.experience || '') || undefined,
          qualification: String(personalDetails.qualification || '') || undefined,
          gender: String(personalDetails.gender || '') || undefined,
          dob: String(personalDetails.dob || '') || undefined,
          religion: String(personalDetails.religion || '') || undefined,
          nationality: String(personalDetails.nationality || '') || undefined,
          bloodGroup: String(personalDetails.blood_group || '') || undefined,
          residenceAddress: String(personalDetails.residence_address || '') || undefined,
        },
        professionalOtherDetails: {
          aadharNo: String(otherDetails.aadhaar_number || '') || undefined,
          panNo: String(otherDetails.pan_number || '') || undefined,
          esiNo: String(otherDetails.esi_number || '') || undefined,
          pfNo: String(otherDetails.pf_number || '') || undefined,
          exitDate: String(otherDetails.exit_date || '') || undefined,
          biometricUserId: String(otherDetails.biometric_user_id || '') || undefined,
        },
        dateOfBirth: '',
        address: '',
        joiningDate: String(record.joining_date || new Date().toISOString()),
        department: (record.department as { department_name?: string } | null)?.department_name || String(record.department || ''),
        position: record.employee_type?.type_name || '',
        employeeType: record.employee_type?.type_name ?? '',
        status: record.status === true,
        createdAt: String(record.created_at || new Date().toISOString()),
        updatedAt: String(record.updated_at || new Date().toISOString()),
        isSuperAdmin: record?.is_super_admin as boolean | undefined,
        isCpdInvolved: record.is_cpd_involved === true,
        profileDocuments: Array.isArray(record.documents) ? record.documents as unknown[] : [],
        documents: documents,
        clientId: record.client_id as string
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
      .select('*, employee_type:employee_type(id, type_name), department:employee_departments(id, department_name), personal_details:employee_personal_details(*), other_details:employee_other_details(*)')
      .eq('client_id', clientId) // MANDATORY client_id filter
      .eq('status', true) // Only fetch active employees
      .eq('is_secondary_super_admin', false); // Secondary super admins are hidden from employee lists

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
    const { data: documentsData, error: documentsError } = await supabase
      .from('employee_documents' as const)
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
    const employees = (employeesData as EmployeeDbRow[]).map(record => {
      // Find documents for this employee
      const employeeDocuments = ((documentsData as DocumentDbRow[]) || []).filter(doc => doc.employee_id === record.id);

      // Map employee documents to our VerificationDocument interface
      const documents: VerificationDocument[] = employeeDocuments.map(doc => ({
        id: doc.id as string,
        employeeId: record.id as string,
        documentTypeId: String(doc.document_type_id || ''),
        documentTypeName: doc.document_type?.name || 'Unknown',
        documentNumber: String(doc.document_number || ''),
        documentImage: String(doc.document_url || ''),
        verificationStatus: (doc.verification_status as VerificationDocument['verificationStatus']) || 'pending',
        verificationMethod: 'manual' as const,
        personalInfo: doc.personal_info || undefined,
        employee_docs_log: [],
        params: {},
        cronActivate: false,
        createdAt: String(doc.created_at || new Date().toISOString()),
        updatedAt: String(doc.updated_at || new Date().toISOString())
      }));

      const personalDetailsRaw = record.personal_details;
      const personalDetails: Record<string, unknown> = Array.isArray(personalDetailsRaw) ? (personalDetailsRaw[0] as Record<string, unknown>) || {} : (personalDetailsRaw as Record<string, unknown>) || {};
      const otherDetailsRaw = record.other_details;
      const otherDetails: Record<string, unknown> = Array.isArray(otherDetailsRaw) ? (otherDetailsRaw[0] as Record<string, unknown>) || {} : (otherDetailsRaw as Record<string, unknown>) || {};
      const employee: Employee = {
        id: record.id,
        employeeId: record.employee_id || '',
        name: (record.aadhar_verified_name as string) || `${record.first_name} ${record.last_name}`,
        firstName: record.first_name,
        lastName: record.last_name,
        aadharVerifiedName: (record.aadhar_verified_name as string) || undefined,
        email: record.email || '',
        phone: (record.phone as string) || '',
        designation: (record.designation as string) || '',
        personalDetails: {
          middleName: String(personalDetails.middle_name || '') || undefined,
          fatherName: String(personalDetails.father_name || '') || undefined,
          staffId: String(personalDetails.staff_id || '') || undefined,
          experience: String(personalDetails.experience || '') || undefined,
          qualification: String(personalDetails.qualification || '') || undefined,
          gender: String(personalDetails.gender || '') || undefined,
          dob: String(personalDetails.dob || '') || undefined,
          religion: String(personalDetails.religion || '') || undefined,
          nationality: String(personalDetails.nationality || '') || undefined,
          bloodGroup: String(personalDetails.blood_group || '') || undefined,
          residenceAddress: String(personalDetails.residence_address || '') || undefined,
        },
        professionalOtherDetails: {
          aadharNo: String(otherDetails.aadhaar_number || '') || undefined,
          panNo: String(otherDetails.pan_number || '') || undefined,
          esiNo: String(otherDetails.esi_number || '') || undefined,
          pfNo: String(otherDetails.pf_number || '') || undefined,
          exitDate: String(otherDetails.exit_date || '') || undefined,
          biometricUserId: String(otherDetails.biometric_user_id || '') || undefined,
        },
        profileDocuments: Array.isArray(record.documents) ? record.documents as unknown[] : [],
        dateOfBirth: '',
        address: '',
        joiningDate: String(record.joining_date || new Date().toISOString()),
        department: (record.department as { department_name?: string } | null)?.department_name || String(record.department || ''),
        position: record.employee_type?.type_name || '',
        employeeType: record.employee_type?.type_name ?? '',
        status: record.status === true,
        createdAt: String(record.created_at || new Date().toISOString()),
        updatedAt: String(record.updated_at || new Date().toISOString()),
        isSuperAdmin: record?.is_super_admin as boolean | undefined,
        isCpdInvolved: record.is_cpd_involved === true,
        documents: documents,
        clientId: record.client_id as string,
        sopStatistics: sopStatisticsMap.get(record.id as string) || {
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
      .select('*, employee_type:employee_type(id, type_name), department:employee_departments(id, department_name), personal_details:employee_personal_details(*), other_details:employee_other_details(*)')
      .eq('id', id)
      .eq('is_secondary_super_admin', false); // Secondary super admins are hidden from employee lookups
    
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
    const dataRow = data as unknown as EmployeeDbRow;
    const personalDetailsRaw = dataRow.personal_details;
    const personalDetails: Record<string, unknown> = Array.isArray(personalDetailsRaw) ? (personalDetailsRaw[0] as Record<string, unknown>) || {} : (personalDetailsRaw as Record<string, unknown>) || {};
    const otherDetailsRaw = dataRow.other_details;
    const otherDetails: Record<string, unknown> = Array.isArray(otherDetailsRaw) ? (otherDetailsRaw[0] as Record<string, unknown>) || {} : (otherDetailsRaw as Record<string, unknown>) || {};
    const employee: Employee = {
      id: data.id,
      employeeId: data.employee_id || '',
      name: (dataRow.aadhar_verified_name as string) || `${data.first_name} ${data.last_name}`,
      firstName: data.first_name,
      lastName: data.last_name,
      aadharVerifiedName: (dataRow.aadhar_verified_name as string) || undefined,
      email: data.email || '',
      phone: String(dataRow.phone || ''),
      profileDocuments: Array.isArray(dataRow.documents) ? dataRow.documents as unknown[] : [],
      personalDetails: {
        middleName: String(personalDetails.middle_name || '') || undefined,
        fatherName: String(personalDetails.father_name || '') || undefined,
        staffId: String(personalDetails.staff_id || '') || undefined,
        experience: String(personalDetails.experience || '') || undefined,
        qualification: String(personalDetails.qualification || '') || undefined,
        gender: String(personalDetails.gender || '') || undefined,
        dob: String(personalDetails.dob || '') || undefined,
        religion: String(personalDetails.religion || '') || undefined,
        nationality: String(personalDetails.nationality || '') || undefined,
        bloodGroup: String(personalDetails.blood_group || '') || undefined,
        residenceAddress: String(personalDetails.residence_address || '') || undefined,
      },
      professionalOtherDetails: {
        aadharNo: String(otherDetails.aadhaar_number || '') || undefined,
        panNo: String(otherDetails.pan_number || '') || undefined,
        esiNo: String(otherDetails.esi_number || '') || undefined,
        pfNo: String(otherDetails.pf_number || '') || undefined,
        exitDate: String(otherDetails.exit_date || '') || undefined,
        biometricUserId: String(otherDetails.biometric_user_id || '') || undefined,
      },
      dateOfBirth: '',
      address: '',
      joiningDate: data.joining_date || new Date().toISOString(),
      department: (dataRow.department as { department_name?: string } | null)?.department_name || String(dataRow.department || ''),
      position: dataRow.employee_type?.type_name || '',
      employeeType: dataRow.employee_type?.type_name ?? '',
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
      .select('*, employee_type:employee_type(id, type_name), department:employee_departments(id, department_name), personal_details:employee_personal_details(*), other_details:employee_other_details(*)')
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
    const dataRow2 = data as unknown as EmployeeDbRow;
    const personalDetailsRaw = dataRow2.personal_details;
    const personalDetails: Record<string, unknown> = Array.isArray(personalDetailsRaw) ? (personalDetailsRaw[0] as Record<string, unknown>) || {} : (personalDetailsRaw as Record<string, unknown>) || {};
    const otherDetailsRaw = dataRow2.other_details;
    const otherDetails: Record<string, unknown> = Array.isArray(otherDetailsRaw) ? (otherDetailsRaw[0] as Record<string, unknown>) || {} : (otherDetailsRaw as Record<string, unknown>) || {};
    return {
      id: data.id,
      employeeId: data.employee_id || '',
      name: (dataRow2.aadhar_verified_name as string) || `${data.first_name} ${data.last_name}`,
      firstName: data.first_name,
      lastName: data.last_name,
      aadharVerifiedName: (dataRow2.aadhar_verified_name as string) || undefined,
      email: data.email || '',
      phone: '',
      designation: String(dataRow2.designation || ''),
      profileDocuments: Array.isArray(dataRow2.documents) ? dataRow2.documents as unknown[] : [],
      personalDetails: {
        middleName: String(personalDetails.middle_name || '') || undefined,
        fatherName: String(personalDetails.father_name || '') || undefined,
        staffId: String(personalDetails.staff_id || '') || undefined,
        experience: String(personalDetails.experience || '') || undefined,
        qualification: String(personalDetails.qualification || '') || undefined,
        gender: String(personalDetails.gender || '') || undefined,
        dob: String(personalDetails.dob || '') || undefined,
        religion: String(personalDetails.religion || '') || undefined,
        nationality: String(personalDetails.nationality || '') || undefined,
        bloodGroup: String(personalDetails.blood_group || '') || undefined,
        residenceAddress: String(personalDetails.residence_address || '') || undefined,
      },
      professionalOtherDetails: {
        aadharNo: String(otherDetails.aadhaar_number || '') || undefined,
        panNo: String(otherDetails.pan_number || '') || undefined,
        esiNo: String(otherDetails.esi_number || '') || undefined,
        pfNo: String(otherDetails.pf_number || '') || undefined,
        exitDate: String(otherDetails.exit_date || '') || undefined,
        biometricUserId: String(otherDetails.biometric_user_id || '') || undefined,
      },
      dateOfBirth: '',
      address: '',
      joiningDate: data.joining_date || new Date().toISOString(),
      department: (dataRow2.department as { department_name?: string } | null)?.department_name || String(dataRow2.department || ''),
      position: dataRow2.employee_type?.type_name || '',
      employeeType: dataRow2.employee_type?.type_name ?? '',
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
