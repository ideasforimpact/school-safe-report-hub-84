import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CustomDocumentRequest {
  action: 'uploadCustomDocument' | 'manualVerify' | 'reject';
  employeeId?: string;
  clientId?: string;
  documentTypeId?: string;
  documentName?: string;
  documentId?: string;
  verification_notes?: string;
  documentFiles?: Array<{
    name: string;
    base64: string;
    type: string;
    size: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Custom Document Verification: Request received');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const requestBody: CustomDocumentRequest = await req.json();
    console.log('Custom Document Verification: Request body:', JSON.stringify(requestBody, null, 2));

    const { action, employeeId, clientId, documentTypeId, documentName, documentFiles, documentId, verification_notes } = requestBody;

    if (!['uploadCustomDocument', 'manualVerify', 'reject'].includes(action)) {
      throw new Error('Invalid action specified');
    }

    // Handle manual verification
    if (action === 'manualVerify') {
      if (!documentId) {
        throw new Error('Missing documentId for manual verification');
      }

      console.log(`Custom Document Verification: Manual verification for document ${documentId}`);

      const { data: updateData, error: updateError } = await supabase
        .from('employee_documents')
        .update({
          verification_status: 'verified',
          updated_at: new Date().toISOString(),
          employee_docs_log: [
            {
              action: 'manual_verify',
              timestamp: new Date().toISOString(),
              notes: verification_notes || 'Document manually verified by staff.'
            }
          ]
        })
        .eq('id', documentId)
        .select()
        .single();

      if (updateError) {
        console.error('Custom Document Verification: Update error:', updateError);
        throw new Error(`Failed to update document status: ${updateError.message}`);
      }

      console.log('Custom Document Verification: Manual verification successful:', updateData);

      return new Response(JSON.stringify({
        success: true,
        message: 'Document manually verified successfully',
        data: updateData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle rejection
    if (action === 'reject') {
      if (!documentId) {
        throw new Error('Missing documentId for rejection');
      }

      console.log(`Custom Document Verification: Rejecting document ${documentId}`);

      const { data: updateData, error: updateError } = await supabase
        .from('employee_documents')
        .update({
          verification_status: 'failed',
          updated_at: new Date().toISOString(),
          employee_docs_log: [
            {
              action: 'reject',
              timestamp: new Date().toISOString(),
              notes: verification_notes || 'Document verification rejected by staff.'
            }
          ]
        })
        .eq('id', documentId)
        .select()
        .single();

      if (updateError) {
        console.error('Custom Document Verification: Update error:', updateError);
        throw new Error(`Failed to update document status: ${updateError.message}`);
      }

      console.log('Custom Document Verification: Rejection successful:', updateData);

      return new Response(JSON.stringify({
        success: true,
        message: 'Document rejected successfully',
        data: updateData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!employeeId || !clientId || !documentTypeId || !documentName || !documentFiles?.length) {
      throw new Error('Missing required fields: employeeId, clientId, documentTypeId, documentName, or documentFiles');
    }

    // Validate total file size (30MB limit)
    const totalSize = documentFiles.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 30 * 1024 * 1024; // 30MB in bytes

    if (totalSize > maxSize) {
      throw new Error('Total file size exceeds 30MB limit');
    }

    console.log(`Custom Document Verification: Processing ${documentFiles.length} files for employee ${employeeId}`);

    // Upload files to storage
    const uploadedFiles: string[] = [];
    
    for (const file of documentFiles) {
      try {
        // Convert base64 to blob
        const base64Data = file.base64.split(',')[1] || file.base64;
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Generate unique file path
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileExtension = file.name.split('.').pop() || 'bin';
        const fileName = `${employeeId}/${documentTypeId}/${timestamp}_${file.name}`;
        
        console.log(`Custom Document Verification: Uploading file: ${fileName}`);
        
        // Upload to employee_other_documents bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employee_other_documents')
          .upload(fileName, binaryData, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          console.error(`Custom Document Verification: Upload error for ${file.name}:`, uploadError);
          throw new Error(`Failed to upload file ${file.name}: ${uploadError.message}`);
        }

        console.log(`Custom Document Verification: Successfully uploaded: ${fileName}`);
        uploadedFiles.push(fileName);
        
      } catch (fileError) {
        console.error(`Custom Document Verification: Error processing file ${file.name}:`, fileError);
        throw new Error(`Failed to process file ${file.name}: ${fileError.message}`);
      }
    }

    // Create document record in database
    const documentData = {
      employee_id: employeeId,
      document_type_id: documentTypeId,
      document_url: uploadedFiles[0], // Primary file
      verification_status: 'pending',
      params: {
        document_name: documentName,
        uploaded_files: uploadedFiles,
        file_count: uploadedFiles.length,
        total_size: totalSize,
        custom_document: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Custom Document Verification: Creating document record:', documentData);

    const { data: documentRecord, error: insertError } = await supabase
      .from('employee_documents')
      .insert(documentData)
      .select()
      .single();

    if (insertError) {
      console.error('Custom Document Verification: Database insert error:', insertError);
      throw new Error(`Failed to create document record: ${insertError.message}`);
    }

    console.log('Custom Document Verification: Document record created successfully:', documentRecord);

    const response = {
      success: true,
      message: `Custom document "${documentName}" uploaded successfully with ${uploadedFiles.length} files`,
      data: {
        documentId: documentRecord.id,
        employeeId,
        documentName,
        filesUploaded: uploadedFiles.length,
        totalSize,
        uploadedFiles
      }
    };

    console.log('Custom Document Verification: Success response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Custom Document Verification: Error:', error);
    
    const errorResponse = {
      success: false,
      error: error.message || 'An unexpected error occurred during custom document upload',
      details: error.stack
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});