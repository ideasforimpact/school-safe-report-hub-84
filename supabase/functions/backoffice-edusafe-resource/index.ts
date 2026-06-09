import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = getSupabaseUrl()
    const supabaseKey = getSupabaseServiceRoleKey()
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, ...body } = await req.json()

    console.log('Backoffice EduSafe Resource operation:', action, body)

    switch (action) {
      case 'list':
        return await listResources(supabase, body)
      case 'list_all':
        return await listAllResources(supabase)
      case 'create':
        return await createResource(supabase, body)
      case 'update':
        return await updateResource(supabase, body)
      case 'delete':
        return await deleteResource(supabase, body)
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('Error in backoffice-edusafe-resource function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function listResources(supabase: any, { client_type_id }: { client_type_id: string }) {
  console.log('Listing resources for client type:', client_type_id)
  
  const { data: resources, error } = await supabase
    .from('backoffice_edusafe_resource')
    .select('*')
    .eq('client_type_id', client_type_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching resources:', error)
    throw error
  }

  console.log('Found resources:', resources?.length || 0)

  return new Response(
    JSON.stringify({ resources: resources || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function listAllResources(supabase: any) {
  console.log('Listing all resources')
  
  const { data: resources, error } = await supabase
    .from('backoffice_edusafe_resource')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all resources:', error)
    throw error
  }

  console.log('Found resources:', resources?.length || 0)

  return new Response(
    JSON.stringify({ resources: resources || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createResource(supabase: any, data: any) {
  console.log('Creating resource for client type:', data.client_type_id)
  
  // Validate required fields
  if (!data.client_type_id) {
    throw new Error('client_type_id is required');
  }
  
  let document_url = data.document_url;
  let fileSize: number | null = null;
  // If document_url contains base64 data, upload to storage
  if (data.document_url && data.document_url.startsWith('data:')) {
    try {
      // Extract file extension from mime type or use pdf as default
      const mimeMatch = data.document_url.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const extension = getFileExtension(mimeType);
      
      // Generate unique filename
      const timestamp = new Date().getTime();
      const filename = `${data.client_type_id}/${timestamp}_${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
      
      // Convert base64 to blob
      const base64Data = data.document_url.split(',')[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      fileSize = binaryData.length;
      // Upload to storage
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from('edusafe-resources')
        .upload(filename, binaryData, {
          contentType: mimeType,
          upsert: true
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('edusafe-resources')
        .getPublicUrl(filename);
      
      document_url = urlData.publicUrl;
      console.log('File uploaded successfully:', document_url);
      
    } catch (storageError) {
      console.error('Error uploading to storage:', storageError);
      // Fallback to base64 if storage fails
      console.log('Falling back to base64 storage');
    }
  }
  
  // Generate a proper UUID for uploaded_by field
  const uploadedByUuid = crypto.randomUUID();
  
  const resourceData = {
    title: data.title,
    description: data.description,
    category: data.category,
    tags: Array.isArray(data.tags) ? data.tags : [],
    document_url: document_url,
    client_type_id: data.client_type_id,
    uploaded_by: uploadedByUuid,
    file_size: fileSize,
  }

  const { data: resource, error } = await supabase
    .from('backoffice_edusafe_resource')
    .insert([resourceData])
    .select()
    .single()

  if (error) {
    console.error('Error creating resource:', error)
    throw error
  }

  console.log('Created resource:', resource.id)

  return new Response(
    JSON.stringify({ resource }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateResource(supabase: any, data: any) {
  console.log('Updating resource:', data.id)
  
  // Validate required fields
  if (!data.client_type_id) {
    throw new Error('client_type_id is required for file uploads');
  }
  
  const updateData: any = {
    title: data.title,
    description: data.description,
    client_type_id:data.client_type_id,
    category: data.category,
    tags: Array.isArray(data.tags) ? data.tags : [],
    updated_at: new Date().toISOString()
  }

  // Handle file update if provided
  if (data.document_url && data.document_url.startsWith('data:')) {
    try {
      // Extract file extension from mime type or use pdf as default
      const mimeMatch = data.document_url.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const extension = getFileExtension(mimeType);
      
      // Generate unique filename
      const timestamp = new Date().getTime();
      const filename = `${data.client_type_id}/${timestamp}_${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
      
      // Convert base64 to blob
      const base64Data = data.document_url.split(',')[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      updateData.file_size = binaryData.length;
      // Upload to storage
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from('edusafe-resources')
        .upload(filename, binaryData, {
          contentType: mimeType,
          upsert: true
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('edusafe-resources')
        .getPublicUrl(filename);
      
      updateData.document_url = urlData.publicUrl;
      console.log('File uploaded successfully:', updateData.document_url);
      
    } catch (storageError) {
      console.error('Error uploading to storage:', storageError);
      // Don't update document_url or file_size if storage fails
    }
  }

  const { data: resource, error } = await supabase
    .from('backoffice_edusafe_resource')
    .update(updateData)
    .eq('id', data.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating resource:', error)
    throw error
  }

  console.log('Updated resource:', resource.id)

  return new Response(
    JSON.stringify({ resource }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteResource(supabase: any, { id }: { id: string }) {
  console.log('Deleting resource:', id)
  
  // Get the resource to find the file URL
  const { data: resource, error: fetchError } = await supabase
    .from('backoffice_edusafe_resource')
    .select('document_url')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching resource for deletion:', fetchError)
  }
  
  // Delete from database
  const { error } = await supabase
    .from('backoffice_edusafe_resource')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting resource:', error)
    throw error
  }
  
  // Try to delete from storage if it's a storage URL
  if (resource && resource.document_url && resource.document_url.includes('/storage/v1/object/public/edusafe-resources/')) {
    try {
      const filename = resource.document_url.split('/storage/v1/object/public/edusafe-resources/')[1];
      await supabase.storage
        .from('edusafe-resources')
        .remove([filename]);
      console.log('File deleted from storage:', filename);
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue even if storage deletion fails
    }
  }

  console.log('Deleted resource:', id)

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function getFileExtension(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'text/plain': 'txt'
  };
  
  return mimeToExt[mimeType] || 'pdf';
}
