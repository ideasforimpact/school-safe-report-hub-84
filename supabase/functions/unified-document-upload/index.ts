import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Maps an employee_document_type.name (Employee Verification) to the
// compliance document key used by the Users module
// (src/constants/employeeComplianceDocuments.ts). Keep in sync with the
// equivalent map in supabase/functions/fetch-employee-document-prefill.
const PROFILE_DOCUMENT_KEY_BY_TYPE: Record<string, string> = {
  aadhar: 'aadhaarCard',
  pan: 'panCard',
  passport: 'passport',
};

const PROFILE_DOCUMENTS_BUCKET = 'employee_profile_documents';

interface DocumentUploadRequest {
  employeeId: string;
  clientId: string;
  documentTypeId: string;
  documentNumber?: string;
  documentFile: {
    name: string;
    type: string;
    size: number;
    base64: string; // may include data: prefix
  };
  params?: Record<string, any>; // For DOB, account details, etc.
}

// Sanitize filename for storage
function sanitizeFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  
  const sanitizedName = name
    .replace(/ /g, '_')
    .replace(/[()]/g, '_')
    .replace(/[–—]/g, '-')
    .replace(/[[\]{}#%^&*+=|<>?/\\]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  return sanitizedName + extension;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseServiceKey = getSupabaseServiceRoleKey();
    const storageBase = Deno.env.get('PUBLIC_STORAGE_BASE_URL');
    const normalizedBase = storageBase.replace(/\/$/, '');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: DocumentUploadRequest = await req.json();
    const { employeeId, clientId, documentTypeId, documentNumber, documentFile, params } = body;

    if (!employeeId || !clientId || !documentTypeId || !documentFile) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 1) Validate employee belongs to client
    const { data: employee, error: empErr } = await supabase
      .from('employees')
      .select('id, client_id, employee_id, documents')
      .eq('id', employeeId)
      .eq('client_id', clientId)
      .single();
    
    if (empErr || !employee) {
      return new Response(JSON.stringify({ error: 'Employee not found or access denied' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 2) Get document type info
    const { data: docType, error: docTypeErr } = await supabase
      .from('employee_document_type')
      .select('id, name')
      .eq('id', documentTypeId)
      .single();
    
    if (docTypeErr || !docType) {
      return new Response(JSON.stringify({ error: 'Invalid document type' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 3) Get pending status ID
    const { data: pendingStatus, error: statusErr } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'pending')
      .single();
    
    if (statusErr || !pendingStatus) {
      return new Response(JSON.stringify({ error: 'Pending status not found' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 4) Upload file to storage (single file, no loop)
    let storagePath = '';
    try {
      const base64Data = documentFile.base64.split(',')[1] || documentFile.base64;
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedFileName = sanitizeFilename(documentFile.name);
      const fileName = `${employeeId}/${documentTypeId}/${timestamp}_${sanitizedFileName}`;
      
      console.log(`Uploading file: ${fileName}`);
      
      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(fileName, binaryData, {
          contentType: documentFile.type,
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      storagePath = fileName;
      console.log(`Successfully uploaded: ${storagePath}`);
    } catch (uploadErr) {
      console.error('Upload error:', uploadErr);
      return new Response(JSON.stringify({ error: `File upload failed: ${uploadErr.message}` }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 5) Create document record in database
    const documentData = {
      employee_id: employeeId,
      document_type_id: documentTypeId,
      document_number: documentNumber || null,
      document_url: storagePath, // Store only the file path
      verification_status: 'pending',
      document_status_id: pendingStatus.id,
      params: params || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating document record:', documentData);

    const { data: documentRecord, error: insertError } = await supabase
      .from('employee_documents')
      .insert(documentData)
      .select(`
        id,
        employee_id,
        document_type_id,
        document_number,
        document_url,
        verification_status,
        document_status_id,
        params,
        created_at,
        updated_at,
        document_type:employee_document_type(name, description),
        document_status:document_status(name, description)
      `)
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(JSON.stringify({ error: `Failed to create document record: ${insertError.message}` }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log('Document record created successfully:', documentRecord);

    // 6) Best-effort sync back to the Users module: Aadhaar/PAN/Passport
    // uploaded here should replace the matching profile document so the two
    // modules don't drift. Never fails the request - the verification
    // document above is already saved.
    let profileSyncWarning: string | undefined;
    const profileDocKey = PROFILE_DOCUMENT_KEY_BY_TYPE[docType.name];
    if (profileDocKey) {
      try {
        const base64Data = documentFile.base64.split(',')[1] || documentFile.base64;
        const profileBinaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const profileSanitizedFileName = sanitizeFilename(documentFile.name);
        const profileTimestamp = Date.now();
        const employeeKey = employee.employee_id || employeeId;
        const profileStoragePath = `${clientId}/${employeeKey}/${profileDocKey}/${profileTimestamp}_${profileSanitizedFileName}`;

        const { error: profileUploadError } = await supabase.storage
          .from(PROFILE_DOCUMENTS_BUCKET)
          .upload(profileStoragePath, profileBinaryData, {
            contentType: documentFile.type,
            upsert: false
          });

        if (profileUploadError) {
          throw new Error(`Profile upload failed: ${profileUploadError.message}`);
        }

        const existingProfileDocuments = Array.isArray(employee.documents) ? employee.documents : [];
        const otherProfileDocuments = existingProfileDocuments.filter((doc: any) => doc?.key !== profileDocKey);
        const mergedProfileDocuments = [
          ...otherProfileDocuments,
          {
            key: profileDocKey,
            fileName: profileSanitizedFileName,
            filePath: profileStoragePath,
            uploadedAt: new Date().toISOString(),
          },
        ];

        const { error: profileUpdateError } = await supabase
          .from('employees')
          .update({ documents: mergedProfileDocuments })
          .eq('id', employeeId);

        if (profileUpdateError) {
          throw new Error(`Profile document update failed: ${profileUpdateError.message}`);
        }

        console.log(`Synced ${profileDocKey} back to Users module at ${profileStoragePath}`);
      } catch (syncError) {
        console.error('Error syncing document back to Users module:', syncError);
        profileSyncWarning = (syncError as Error).message || 'Failed to sync document to Users module';
      }
    }

    // 7) Return success response with document info
    const response = {
      success: true,
      message: `${docType.name} document uploaded successfully`,
      document: {
        id: documentRecord.id,
        employeeId: documentRecord.employee_id,
        documentTypeId: documentRecord.document_type_id,
        documentTypeName: documentRecord.document_type?.name || '',
        documentNumber: documentRecord.document_number,
        documentImage: `${normalizedBase}/employee-documents/${storagePath}`, // Full URL for frontend
        verificationStatus: documentRecord.verification_status,
        documentStatusId: documentRecord.document_status_id,
        documentStatusName: documentRecord.document_status?.name || '',
        params: documentRecord.params,
        createdAt: documentRecord.created_at,
        updatedAt: documentRecord.updated_at
      },
      ...(profileSyncWarning ? { profileSyncWarning } : {})
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unified document upload error:', error);
    const message = (error as Error).message || 'Unknown error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
