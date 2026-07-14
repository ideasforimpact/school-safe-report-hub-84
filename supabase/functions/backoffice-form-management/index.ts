import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CustomFormPayload {
  client_id?: string
  client_logo?: string | null
  [key: string]: unknown
}

async function fetchClientLogo(supabaseClient: SupabaseClient, clientId: string): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from('clients')
    .select('logo')
    .eq('id', clientId)
    .maybeSingle()
  if (error) {
    console.log('fetchClientLogo (backoffice) error:', error.message)
    return null
  }
  // @ts-expect-error - logo column not present in generated client types
  return data?.logo || null
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey(),
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, data } = await req.json()

    switch (action) {
      case 'fetch-forms':
        return await fetchForms(supabaseClient, data)
      
      case 'create-form':
        return await createForm(supabaseClient, data)
      
      case 'update-form':
        return await updateForm(supabaseClient, data)
      
      case 'delete-form':
        return await deleteForm(supabaseClient, data)
      
      case 'fetch-submissions':
        return await fetchSubmissions(supabaseClient, data)
      
      case 'update-submission-status':
        return await updateSubmissionStatus(supabaseClient, data)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

interface FetchFormsData {
  client_id?: string
}

async function fetchForms(supabaseClient: SupabaseClient, data: FetchFormsData) {
  try {
    const { client_id } = data
    
    let query = supabaseClient
      .from('custom_forms')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (client_id) {
      query = query.eq('client_id', client_id)
    }
    
    const { data: forms, error } = await query
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ success: true, data: forms }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
}

interface CreateFormData {
  form: CustomFormPayload
}

async function createForm(supabaseClient: SupabaseClient, data: CreateFormData) {
  try {
    const { form } = data
    // If client_logo missing/null, populate from clients.logo based on client_id
    const payload = { ...form }
    if (payload.client_id && (payload.client_logo === undefined || payload.client_logo === null)) {
      payload.client_logo = await fetchClientLogo(supabaseClient, payload.client_id)
    }
    
    const { data: newForm, error } = await supabaseClient
      .from('custom_forms')
      .insert([payload])
      .select()
      .single()
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ success: true, data: newForm }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
}

interface UpdateFormData {
  id: string
  updates: CustomFormPayload
}

async function updateForm(supabaseClient: SupabaseClient, data: UpdateFormData) {
  try {
    const { id, updates } = data
    const updatesCopy = { ...updates }
    if (updatesCopy.client_id && updatesCopy.client_logo === null) {
      updatesCopy.client_logo = await fetchClientLogo(supabaseClient, updatesCopy.client_id)
    }
    
    const { data: updatedForm, error } = await supabaseClient
      .from('custom_forms')
      .update(updatesCopy)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ success: true, data: updatedForm }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
}

interface DeleteFormData {
  id: string
}

async function deleteForm(supabaseClient: SupabaseClient, data: DeleteFormData) {
  try {
    const { id } = data
    
    const { error } = await supabaseClient
      .from('custom_forms')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
}

interface FetchSubmissionsData {
  form_id: string
}

async function fetchSubmissions(supabaseClient: SupabaseClient, data: FetchSubmissionsData) {
  try {
    const { form_id } = data
    
    const { data: submissions, error } = await supabaseClient
      .from('form_submissions')
      .select('*')
      .eq('form_id', form_id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ success: true, data: submissions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
}

interface UpdateSubmissionStatusData {
  id: string
  status: string
  comments?: string
}

async function updateSubmissionStatus(supabaseClient: SupabaseClient, data: UpdateSubmissionStatusData) {
  try {
    const { id, status, comments } = data
    
    const { data: updatedSubmission, error } = await supabaseClient
      .from('form_submissions')
      .update({ status, comments, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ success: true, data: updatedSubmission }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw error
  }
} 