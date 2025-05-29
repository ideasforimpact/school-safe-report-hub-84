
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, ...body } = await req.json()

    console.log('Backoffice EduSafe Resource operation:', action, body)

    switch (action) {
      case 'list':
        return await listResources(supabase, body)
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

async function listResources(supabase: any, { client_id }: { client_id: string }) {
  console.log('Listing resources for client:', client_id)
  
  const { data: resources, error } = await supabase
    .from('backoffice_edusafe_resource')
    .select('*')
    .eq('client_id', client_id)
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

async function createResource(supabase: any, data: any) {
  console.log('Creating resource for client:', data.client_id)
  
  const resourceData = {
    title: data.title,
    description: data.description,
    category: data.category,
    tags: data.tags || [],
    document_url: data.document_url,
    client_id: data.client_id,
    uploaded_by: 'backoffice-admin', // This would ideally come from auth context
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
  
  const updateData: any = {
    title: data.title,
    description: data.description,
    category: data.category,
    tags: data.tags || [],
    updated_at: new Date().toISOString()
  }

  // Only update document_url if provided
  if (data.document_url) {
    updateData.document_url = data.document_url
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
  
  const { error } = await supabase
    .from('backoffice_edusafe_resource')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting resource:', error)
    throw error
  }

  console.log('Deleted resource:', id)

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
