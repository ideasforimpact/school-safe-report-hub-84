
import { supabase } from '@/integrations/supabase/client';
import { Employee, VerificationDocument } from '@/types/employeeVerification';

// Module-level dedup for fetchEmployeeDocuments: concurrent calls for the same key share
// one in-flight request; sequential calls within 3s return the last result without a
// new network call. Prevents the post-verification callback + realtime double-fetch pattern.
const docFetchInflight = new Map<string, Promise<VerificationDocument[]>>();
const docFetchLastTime = new Map<string, number>();
const DOC_FETCH_COOLDOWN_MS = 3000;

// Map the edge function document response to VerificationDocument
const mapEdgeDocument = (doc: any): VerificationDocument => ({
  id: doc.id,
  employeeId: doc.employeeId,
  documentTypeId: doc.documentTypeId || '',
  documentTypeName: doc.documentTypeName || 'Unknown',
  documentNumber: doc.documentNumber || '',
  documentImage: doc.documentImage,
  verificationStatus: (doc.verificationStatus as VerificationDocument['verificationStatus']) || 'pending',
  documentStatusId: doc.documentStatusId,
  documentStatusName: doc.documentStatusName,
  verifiedByEmployeeId: doc.verifiedByEmployeeId || undefined,
  verificationDate: null,
  verificationNotes: '',
  verificationMethod: 'manual',
  rejectReason: doc.rejectReason || undefined,
  apiResponseData: doc.apiResponseData || undefined,
  apiVerificationStatus: doc.apiVerificationStatus || null,
  apiVerificationDate: doc.apiVerificationDate || undefined,
  apiVerificationMethod: doc.apiVerificationMethod || undefined,
  params: doc.params || {},
  employee_docs_log: Array.isArray(doc.employee_docs_log) ? doc.employee_docs_log : [],
  documents_files: Array.isArray(doc.documents_files) ? doc.documents_files : [],
  comments: Array.isArray(doc.comments) ? doc.comments : [],
  personalInfo: doc.personalInfo || undefined,
  lastOtpGenerated: doc.lastOtpGenerated || undefined,
  cronActivate: doc.cronActivate || false,
  cronActivatedDate: doc.cronActivatedDate || undefined,
  cronUpdatedDate: doc.cronUpdatedDate || undefined,
  cronLog: Array.isArray(doc.cronLog) ? doc.cronLog : [],
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export interface EmployeeVerificationData {
  employee: Employee | null;
  documents: VerificationDocument[];
}

// Helper function to upload base64 file to Supabase storage
const uploadDocumentToStorage = async (base64Data: string, employeeId: string, documentType: string): Promise<string> => {
  try {
    // Extract the base64 content and content type
    const base64Regex = /^data:([^;]+);base64,(.+)$/;
    const matches = base64Data.match(base64Regex);
    
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 image format");
    }
    
    const contentType = matches[1];
    const base64Content = matches[2];
    const binaryData = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    
    // Generate a unique file path
    const timestamp = new Date().getTime();
    const fileExtension = contentType.includes('pdf') ? 'pdf' : 'jpg';
    const filePath = `${employeeId}/${documentType}_${timestamp}.${fileExtension}`;
    
    console.log('Uploading file to storage at path:', filePath);
    
    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('employee-documents')
      .upload(filePath, binaryData, {
        contentType,
        upsert: true
      });
    
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw uploadError;
    }
    
    console.log('File uploaded successfully:', uploadData);
    
    // Return the file path for database storage
    return filePath;
  } catch (error) {
    console.error('Error uploading document to storage:', error);
    throw error;
  }
};

export const fetchEmployeeVerificationData = async (employeeId: string, clientId: string): Promise<EmployeeVerificationData> => {
  try {
    // Fetch employee details via edge function
    const { data: empData, error: empError } = await supabase.functions.invoke('employee-management', {
      body: { operation: 'get_employee', employeeId, clientId },
    });

    if (empError || !empData?.employee) {
      console.error('Error fetching employee:', empError);
      return { employee: null, documents: [] };
    }

    const rec = empData.employee;
    const dept = rec.department;
    const empType = rec.employee_type;
    const personalDetailsRaw = rec.personal_details;
    const personalDetails = Array.isArray(personalDetailsRaw) ? personalDetailsRaw[0] || {} : personalDetailsRaw || {};
    const otherDetailsRaw = rec.other_details;
    const otherDetails = Array.isArray(otherDetailsRaw) ? otherDetailsRaw[0] || {} : otherDetailsRaw || {};

    const employee: Employee = {
      id: rec.id,
      employeeId: rec.employee_id || '',
      name: `${rec.first_name || ''} ${rec.last_name || ''}`.trim(),
      firstName: rec.first_name || '',
      lastName: rec.last_name || '',
      email: rec.email || '',
      phone: rec.phone || '',
      designation: rec.designation || '',
      dateOfBirth: '',
      address: '',
      joiningDate: rec.joining_date || new Date().toISOString(),
      department: typeof dept === 'object' && dept !== null ? dept.department_name || '' : dept || '',
      position: typeof empType === 'object' && empType !== null ? empType.type_name || '' : empType || '',
      employeeType: (typeof empType === 'object' && empType !== null ? empType.type_name : empType) as Employee['employeeType'] || 'permanent',
      status: rec.status === true,
      createdAt: rec.created_at || new Date().toISOString(),
      updatedAt: rec.updated_at || new Date().toISOString(),
      clientId: rec.client_id,
      isSuperAdmin: rec.is_super_admin,
      isCpdInvolved: rec.is_cpd_involved === true,
      personalDetails: {
        middleName: personalDetails.middle_name || undefined,
        fatherName: personalDetails.father_name || undefined,
        gender: personalDetails.gender || undefined,
        dob: personalDetails.dob || undefined,
        religion: personalDetails.religion || undefined,
        nationality: personalDetails.nationality || undefined,
        bloodGroup: personalDetails.blood_group || undefined,
        residenceAddress: personalDetails.residence_address || undefined,
        experience: personalDetails.experience || undefined,
        qualification: personalDetails.qualification || undefined,
      },
      professionalOtherDetails: {
        aadharNo: otherDetails.aadhaar_number || undefined,
        panNo: otherDetails.pan_number || undefined,
        esiNo: otherDetails.esi_number || undefined,
        pfNo: otherDetails.pf_number || undefined,
        exitDate: otherDetails.exit_date || undefined,
        biometricUserId: otherDetails.biometric_user_id || undefined,
      },
      documents: [],
    };

    // Fetch employee documents via edge function
    const { data: docsData, error: docsError } = await supabase.functions.invoke('employee-documents', {
      body: { employeeId, clientId },
    });

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return { employee, documents: [] };
    }

    const documents: VerificationDocument[] = (docsData?.documents || []).map(mapEdgeDocument);
    return { employee, documents };
  } catch (error) {
    console.error('Error in fetchEmployeeVerificationData:', error);
    return { employee: null, documents: [] };
  }
};

export const fetchEmployeeDocuments = async (
  employeeId: string,
  timeframe?: string,
  force = false
): Promise<VerificationDocument[]> => {
  const key = `${employeeId}:${timeframe || ''}`;

  // Concurrent dedup — attach to any in-flight request for the same key
  const inflight = docFetchInflight.get(key);
  if (inflight) return inflight;

  // Sequential cooldown (3s) — skip unless force=true (user-initiated refresh)
  if (!force) {
    const last = docFetchLastTime.get(key) || 0;
    if (Date.now() - last < DOC_FETCH_COOLDOWN_MS) return [];
  }

  const promise = (async () => {
    try {
      docFetchLastTime.set(key, Date.now());
      const { data, error } = await supabase.functions.invoke('employee-documents', {
        body: { employeeId, timeframe: timeframe && timeframe !== 'all' ? timeframe : undefined },
      });
      if (error) throw error;
      return (data?.documents || []).map(mapEdgeDocument);
    } catch (error) {
      console.error('Error in fetchEmployeeDocuments:', error);
      docFetchLastTime.delete(key); // allow immediate retry on error
      return [];
    } finally {
      docFetchInflight.delete(key);
    }
  })();

  docFetchInflight.set(key, promise);
  return promise;
};
