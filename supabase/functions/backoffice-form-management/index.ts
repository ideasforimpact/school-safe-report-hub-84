import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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

async function fetchForms(supabaseClient: any, data: any) {
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

async function createForm(supabaseClient: any, data: any) {
  try {
    const { form } = data
    
    const { data: newForm, error } = await supabaseClient
      .from('custom_forms')
      .insert([form])
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

async function updateForm(supabaseClient: any, data: any) {
  try {
    const { id, updates } = data
    
    const { data: updatedForm, error } = await supabaseClient
      .from('custom_forms')
      .update(updates)
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

async function deleteForm(supabaseClient: any, data: any) {
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

async function fetchSubmissions(supabaseClient: any, data: any) {
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

async function updateSubmissionStatus(supabaseClient: any, data: any) {
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