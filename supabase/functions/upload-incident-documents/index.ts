import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseAnonKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
}

interface IncidentDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  uploadedAt: string;
}

// Helper function to convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper function to upload file to storage
async function uploadFileToStorage(
  supabaseClient: any,
  file: FileItem,
  filePath: string
): Promise<{ path: string }> {
  console.log('Uploading file to storage:', file.name, 'to path:', filePath);
  
  if (!file.base64 || typeof file.base64 !== 'string') {
    throw new Error(`File ${file.name} does not have valid base64 data`);
  }
  
  // Remove data URL prefix if present
  const base64Data = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
  
  const fileBytes = base64ToUint8Array(base64Data);
  
  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from('incident-documents')
    .upload(filePath, fileBytes, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) {
    console.error('Upload error for file:', file.name, uploadError);
    throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
  }

  console.log('Successfully uploaded file:', file.name, 'to:', filePath);
  return { path: filePath };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Parse request body
    const { incidentId, clientId, files } = await req.json();

    console.log('Upload incident documents request:', {
      incidentId,
      clientId,
      filesCount: files?.length || 0
    });

    // Validate required fields
    if (!incidentId) {
      return new Response(
        JSON.stringify({ error: 'Incident ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Client ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Files array is required and must not be empty' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process files and upload to storage
    const uploadedDocuments: IncidentDocument[] = [];
    
    for (const file of files) {
      try {
        console.log('Processing file:', file.name);
        
        // Generate unique file path with hierarchical structure: incidents/{clientId}/{incidentId}/
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop() || '';
        const fileName = `incidents/${clientId}/${incidentId}/${timestamp}_${file.id}.${fileExtension}`;
        
        // Upload file to storage
        const uploadResult = await uploadFileToStorage(supabaseClient, file, fileName);
        
        const document: IncidentDocument = {
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          path: uploadResult.path,
          uploadedAt: new Date().toISOString()
        };

        uploadedDocuments.push(document);
        console.log('Successfully processed file:', file.name);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Successfully uploaded all files:', uploadedDocuments.length);

    // Update incident with documents
    try {
      console.log('Updating incident with documents...');
      
      // Get existing documents from incident
      const { data: existingIncident, error: fetchError } = await supabaseClient
        .from('incidents')
        .select('documents')
        .eq('id', incidentId)
        .single();

      if (fetchError) {
        console.error('Error fetching existing incident documents:', fetchError);
        throw new Error(`Failed to fetch existing documents: ${fetchError.message}`);
      }

      // Combine existing and new documents
      const existingDocuments = existingIncident?.documents || [];
      const allDocuments = [...existingDocuments, ...uploadedDocuments];

      // Update incident with all documents
      const { error: updateError } = await supabaseClient
        .from('incidents')
        .update({ documents: allDocuments })
        .eq('id', incidentId);

      if (updateError) {
        console.error('Error updating incident documents:', updateError);
        throw new Error(`Failed to update incident documents: ${updateError.message}`);
      }

      console.log('Successfully updated incident with documents');
    } catch (updateError) {
      console.error('Error updating incident:', updateError);
      // Don't fail the entire operation if incident update fails
      console.warn('Files uploaded successfully but incident update failed');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        documents: uploadedDocuments,
        message: `Successfully uploaded ${uploadedDocuments.length} document(s) and updated incident`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in upload-incident-documents function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
