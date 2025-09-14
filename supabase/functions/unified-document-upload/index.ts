import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not set`);
  return value;
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
    const supabaseUrl = getEnv('SUPABASE_URL');
    const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    const storageBase = Deno.env.get('PUBLIC_STORAGE_BASE_URL') || 'https://ybvxkiubnnixntghojyy.supabase.co/storage/v1/object/public';
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
      .select('id, client_id')
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

    // 6) Return success response with document info
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
      }
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
