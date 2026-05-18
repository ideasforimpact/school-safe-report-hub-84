import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const requestBody = await req.json()
    const { action, data } = requestBody

    console.log(`EduSafe Resource Client operation: ${action}`, data || {})

    switch (action) {
      case 'fetch_resources':
        return await fetchResources(supabaseAdmin, data)
      case 'add_resource':
        return await addResource(supabaseAdmin, data)
      case 'update_resource':
        return await updateResource(supabaseAdmin, data)
      case 'delete_resource':
        return await deleteResource(supabaseAdmin, data)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error in edusafe-resource-client function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function fetchResources(supabase: any, { client_id }: { client_id: string }) {
  try {
    console.log(`Fetching EduSafe resources for client: ${client_id}`)
    
    // Fetch client info to get client_type_id
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('client_type_id')
      .eq('id', client_id)
      .single()

    if (clientError || !clientData) {
      console.error('Error fetching client info:', clientError)
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch organizational resources for this client
    const { data: orgResources, error: orgError } = await supabase
      .from('edusafe_resources')
      .select('*, clients(name)')
      .eq('client_id', client_id)

    if (orgError) {
      console.error('Error fetching organizational resources:', orgError)
    }

    // Fetch global resources for this client type
    const { data: globalResources, error: globalError } = await supabase
      .from('backoffice_edusafe_resource')
      .select('*')
      .eq('client_type_id', clientData.client_type_id)

    if (globalError) {
      console.error('Error fetching global resources:', globalError)
    }

    const allResources = [
      ...(orgResources || []).map((resource: any) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        category: resource.category,
        tags: resource.tags || [],
        uploadDate: resource.created_at,
        uploaderId: resource.uploaded_by || '',
        uploaderName: resource.clients?.name || clientData.name || 'Unknown',
        ownerType: 'school' as const,
        clientId: resource.client_id,
        resourceType: 'Organisational Resource' as const,
        document_url: resource.document_url,
        youtube_link: resource.youtube_link,
        file_size: resource.file_size || null,
        file: {
          name: resource.title,
          url: resource.document_url,
          type: 'application/pdf',
          size: resource.file_size || 0
        }
      })),
      ...(globalResources || []).map((resource: any) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        category: resource.category,
        tags: resource.tags || [],
        uploadDate: resource.created_at,
        uploaderId: resource.uploaded_by || '',
        uploaderName: 'EduSafe Team',
        ownerType: 'saas' as const,
        clientId: null,
        resourceType: 'Global Resource' as const,
        document_url: resource.document_url, // Add the document_url field
        youtube_link: resource.youtube_link, // Add the youtube_link field
        file: {
          name: resource.title,
          url: resource.document_url,
          type: 'application/pdf'
        }
      }))
    ]

    console.log(`Found ${allResources.length} total resources (${orgResources?.length || 0} organizational, ${globalResources?.length || 0} global)`)

    return new Response(
      JSON.stringify({ resources: allResources }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in fetchResources:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch resources' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function addResource(supabase: any, { resource, client_id }: { resource: any, client_id: string }) {
  try {
    console.log(`Adding resource for client: ${client_id}`)
    
    const { data, error } = await supabase
      .from('edusafe_resources')
      .insert({
        title: resource.title,
        description: resource.description,
        category: resource.category,
        tags: resource.tags || [],
        document_url: resource.file.url,
        client_id: client_id,
        uploaded_by: resource.uploaderId
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding resource:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to add resource' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ resource: data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in addResource:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to add resource' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function updateResource(supabase: any, { id, updates, client_id }: { id: string, updates: any, client_id: string }) {
  try {
    console.log(`Updating resource ${id} for client: ${client_id}`)
    
    const { data, error } = await supabase
      .from('edusafe_resources')
      .update({
        title: updates.title,
        description: updates.description,
        category: updates.category,
        tags: updates.tags || []
      })
      .eq('id', id)
      .eq('client_id', client_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating resource:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update resource' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ resource: data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in updateResource:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update resource' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function deleteResource(supabase: any, { id, client_id }: { id: string, client_id: string }) {
  try {
    console.log(`Deleting resource ${id} for client: ${client_id}`)
    
    const { error } = await supabase
      .from('edusafe_resources')
      .delete()
      .eq('id', id)
      .eq('client_id', client_id)

    if (error) {
      console.error('Error deleting resource:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to delete resource' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in deleteResource:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete resource' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}