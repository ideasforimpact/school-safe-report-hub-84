import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Centralized filename sanitization utility
const sanitizeFilename = (filename: string): string => {
  if (!filename) return '';

  // Split filename and extension
  const lastDotIndex = filename.lastIndexOf('.');
  let name = filename;
  let extension = '';
  
  if (lastDotIndex > 0) {
    name = filename.substring(0, lastDotIndex);
    extension = filename.substring(lastDotIndex);
  }

  // Sanitize the name part (keep extension as-is)
  const sanitizedName = name
    // Replace spaces with underscores
    .replace(/\s+/g, '_')
    // Replace parentheses with underscores
    .replace(/[()]/g, '_')
    // Replace em dash, en dash, and other special dashes with regular hyphen
    .replace(/[—–]/g, '-')
    // Replace other problematic characters but keep alphanumeric, hyphens, underscores, and periods
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    // Remove multiple consecutive underscores/hyphens
    .replace(/[_-]+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');

  return sanitizedName + extension;
};

// Generate a unique filename with timestamp
const generateUniqueFilename = (originalFilename: string): string => {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Split to add timestamp before extension
  const lastDotIndex = sanitized.lastIndexOf('.');
  if (lastDotIndex > 0) {
    const name = sanitized.substring(0, lastDotIndex);
    const extension = sanitized.substring(lastDotIndex);
    return `${timestamp}_${name}${extension}`;
  }
  
  return `${timestamp}_${sanitized}`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Custom Document Verification: Request received');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    console.log('Custom Document Verification: Request body:', JSON.stringify(requestBody, null, 2));

    const { action, employeeId, clientId, documentTypeId, documentName, documentFiles } = requestBody

    if (action === 'uploadCustomDocument') {
      console.log(`Custom Document Verification: Processing ${documentFiles.length} files for employee ${employeeId}`);
      
      const uploadedFiles = []
      
      for (const file of documentFiles) {
        try {
          // Convert base64 to Uint8Array
          const base64Data = file.base64.split(',')[1] || file.base64
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          // Generate sanitized unique filename
          const sanitizedFilename = generateUniqueFilename(file.name);
          const fileName = `${employeeId}/${documentTypeId}/${sanitizedFilename}`;
          
          console.log(`Custom Document Verification: Uploading file: ${fileName}`);

          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('custom-document-verification')
            .upload(fileName, bytes, {
              contentType: file.type || 'application/octet-stream',
              upsert: false
            })

          if (uploadError) {
            console.error(`Custom Document Verification: Upload error for ${file.name}:`, uploadError);
            throw new Error(`Failed to upload file ${file.name}: ${uploadError.message}`)
          }

          // Get public URL
          const { data: urlData } = supabaseClient.storage
            .from('custom-document-verification')
            .getPublicUrl(fileName)

          uploadedFiles.push({
            originalName: file.name,
            fileName: sanitizedFilename,
            path: fileName,
            url: urlData.publicUrl,
            size: bytes.length,
            type: file.type
          })

          console.log(`Custom Document Verification: Successfully uploaded: ${file.name} as ${sanitizedFilename}`);
        } catch (error) {
          console.error(`Custom Document Verification: Error processing file ${file.name}:`, error);
          throw new Error(`Failed to process file ${file.name}: ${error.message}`)
        }
      }

      // Store verification record in database
      const { data: verificationData, error: dbError } = await supabaseClient
        .from('employee_custom_document_verification')
        .insert({
          employee_id: employeeId,
          client_id: clientId,
          document_type_id: documentTypeId,
          document_name: documentName,
          document_files: uploadedFiles,
          verification_status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) {
        console.error('Custom Document Verification: Database error:', dbError);
        throw new Error(`Failed to create verification record: ${dbError.message}`)
      }

      console.log('Custom Document Verification: Successfully created verification record');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: verificationData,
          uploadedFiles: uploadedFiles
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle other actions...
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )

  } catch (error) {
    console.error('Custom Document Verification: Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
