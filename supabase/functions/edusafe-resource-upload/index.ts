
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceRoleKey()
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const method = req.method

    // Handle different HTTP methods
    switch (method) {
      case 'POST':
        return await handleUpload(req)
      case 'PUT':
        return await handleUpdate(req, url)
      case 'DELETE':
        return await handleDelete(req, url)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleUpload(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const tags = formData.get('tags') as string
  const clientId = formData.get('client_id') as string
  const uploadedBy = formData.get('uploaded_by') as string
  const youtubeLink = formData.get('youtube_link') as string

  console.log('Received upload request for client:', clientId)
  console.log('Form data received:', {
    category,
    hasFile: !!file,
    hasTitle: !!title,
    hasYoutubeLink: !!youtubeLink,
    hasClientId: !!clientId
  })

  // Validate required fields based on category
  if (category === 'youtube') {
    // For YouTube category, file is optional but YouTube link is required
    if (!youtubeLink || !title || !category || !clientId) {
      console.log('YouTube validation failed:', {
        youtubeLink: !!youtubeLink,
        title: !!title,
        category: !!category,
        clientId: !!clientId
      })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: youtube_link, title, category, client_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    console.log('YouTube validation passed - file is optional for YouTube category')
  } else {
    // For other categories, file is required
    if (!file || !title || !category || !clientId) {
      console.log('File validation failed:', {
        file: !!file,
        title: !!title,
        category: !!category,
        clientId: !!clientId
      })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, title, category, client_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    console.log('File validation passed')
  }

  // Validate client_id exists and is valid
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .eq('active', true)
    .single()

  if (clientError || !clientData) {
    console.error('Invalid client_id:', clientId, clientError)
    return new Response(
      JSON.stringify({ error: 'Invalid or inactive client_id' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  console.log('Client validated:', clientData.name)

  // Validate uploaded_by if provided - check if employee exists
  let validatedUploadedBy: string | null = null
  if (uploadedBy) {
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('id', uploadedBy)
      .single()

    if (employeeError || !employeeData) {
      console.warn('Invalid uploaded_by employee ID, setting to null:', uploadedBy, employeeError)
      validatedUploadedBy = null
    } else {
      validatedUploadedBy = uploadedBy
    }
  }

  let documentUrl = ''
  
  // Only upload file if it exists (not required for YouTube category)
  if (file) {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${clientId}/${fileName}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('edusafe-resources')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload file to storage' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('File uploaded to storage:', uploadData.path)

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('edusafe-resources')
      .getPublicUrl(filePath)
    
    documentUrl = urlData.publicUrl
  }

  // Parse tags
  let parsedTags: string[] = []
  if (tags) {
    try {
      parsedTags = JSON.parse(tags)
    } catch {
      parsedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }
  }

  // Insert record into edusafe_resources table
  const { data: resourceData, error: insertError } = await supabase
    .from('edusafe_resources')
    .insert({
      title,
      description: description || null,
      category,
      tags: parsedTags,
      document_url: documentUrl,
      youtube_link: youtubeLink || null,
      uploaded_by: validatedUploadedBy,
      client_id: clientId
    })
    .select()
    .single()

  if (insertError) {
    console.error('Database insert error:', insertError)
    
    // Clean up uploaded file if database insert fails (only if file was uploaded)
    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${clientId}/${fileName}`
      await supabase.storage
        .from('edusafe-resources')
        .remove([filePath])
    }

    return new Response(
      JSON.stringify({ error: 'Failed to save resource record' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  console.log('Resource created successfully:', resourceData.id)

  return new Response(
    JSON.stringify({
      success: true,
      resource: resourceData,
      message: 'Resource uploaded successfully'
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleUpdate(req: Request, url: URL) {
  const resourceId = url.searchParams.get('id')
  const clientId = url.searchParams.get('client_id')

  if (!resourceId || !clientId) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters: id and client_id' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const body = await req.json()
  const { title, description, category, tags } = body

  console.log('Received update request for resource:', resourceId, 'client:', clientId)

  // Validate that the resource belongs to the client
  const { data: existingResource, error: fetchError } = await supabase
    .from('edusafe_resources')
    .select('id, client_id')
    .eq('id', resourceId)
    .eq('client_id', clientId)
    .single()

  if (fetchError || !existingResource) {
    console.error('Resource not found or access denied:', resourceId, fetchError)
    return new Response(
      JSON.stringify({ error: 'Resource not found or access denied' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Update the resource
  const { data: updatedResource, error: updateError } = await supabase
    .from('edusafe_resources')
    .update({
      title: title || undefined,
      description: description || undefined,
      category: category || undefined,
      tags: tags || undefined,
      updated_at: new Date().toISOString()
    })
    .eq('id', resourceId)
    .eq('client_id', clientId)
    .select()
    .single()

  if (updateError) {
    console.error('Database update error:', updateError)
    return new Response(
      JSON.stringify({ error: 'Failed to update resource' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  console.log('Resource updated successfully:', updatedResource.id)

  return new Response(
    JSON.stringify({
      success: true,
      resource: updatedResource,
      message: 'Resource updated successfully'
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function handleDelete(req: Request, url: URL) {
  const resourceId = url.searchParams.get('id')
  const clientId = url.searchParams.get('client_id')

  if (!resourceId || !clientId) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters: id and client_id' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  console.log('Received delete request for resource:', resourceId, 'client:', clientId)

  // First, get the resource to verify ownership and get file path for cleanup
  const { data: resourceToDelete, error: fetchError } = await supabase
    .from('edusafe_resources')
    .select('id, client_id, document_url')
    .eq('id', resourceId)
    .eq('client_id', clientId)
    .single()

  if (fetchError || !resourceToDelete) {
    console.error('Resource not found or access denied:', resourceId, fetchError)
    return new Response(
      JSON.stringify({ error: 'Resource not found or access denied' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Delete the database record first
  const { error: deleteError } = await supabase
    .from('edusafe_resources')
    .delete()
    .eq('id', resourceId)
    .eq('client_id', clientId)

  if (deleteError) {
    console.error('Database delete error:', deleteError)
    return new Response(
      JSON.stringify({ error: 'Failed to delete resource' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Extract file path from document_url to delete from storage
  try {
    const urlParts = resourceToDelete.document_url.split('/')
    const filePath = `${clientId}/${urlParts[urlParts.length - 1]}`
    
    // Delete file from storage (optional - don't fail if this doesn't work)
    await supabase.storage
      .from('edusafe-resources')
      .remove([filePath])
      
    console.log('File deleted from storage:', filePath)
  } catch (storageError) {
    console.warn('Failed to delete file from storage, but continuing:', storageError)
  }

  console.log('Resource deleted successfully:', resourceId)

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Resource deleted successfully'
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}
