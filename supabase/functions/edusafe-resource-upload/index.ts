
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const tags = formData.get('tags') as string
    const clientId = formData.get('client_id') as string
    const uploadedBy = formData.get('uploaded_by') as string

    console.log('Received upload request for client:', clientId)

    // Validate required fields
    if (!file || !title || !category || !clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, title, category, client_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
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
        document_url: urlData.publicUrl,
        uploaded_by: uploadedBy || null,
        client_id: clientId
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('edusafe-resources')
        .remove([filePath])

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
