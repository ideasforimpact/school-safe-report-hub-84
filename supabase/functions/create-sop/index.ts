import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateSOPRequest {
  title: string;
  category_id: string;
  description?: string | null;
  status: boolean;
  procedure_steps: string[];
  important_notes?: string | null;
  // These are mandatory for SOP creation
  client_id: string | null;
  employee_id: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestData: CreateSOPRequest = await req.json()
    const { title, category_id, description, status, procedure_steps, important_notes, client_id, employee_id } = requestData

    // Validate required fields
    if (!title || !title.trim()) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'Title is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!category_id) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'Category ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!procedure_steps || procedure_steps.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'At least one procedure step is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate category exists
    const { data: category, error: categoryError } = await supabaseClient
      .from('sop_categories')
      .select('id')
      .eq('id', category_id)
      .single()

    if (categoryError || !category) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'Invalid category ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // client_id and employee_id are mandatory for SOP creation
    if (!client_id) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'client_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!employee_id) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'employee_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate client_id
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'Invalid client ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate employee_id
    const { data: employee, error: employeeError } = await supabaseClient
      .from('employees')
      .select('id')
      .eq('id', employee_id)
      .single()

    if (employeeError || !employee) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'Invalid employee ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check for duplicate title (case-insensitive, within same client)
    const { data: existing, error: dupError } = await supabaseClient
      .from('sop')
      .select('id')
      .eq('client_id', client_id)
      .ilike('title', title.trim())
      .maybeSingle()

    if (!dupError && existing) {
      return new Response(
        JSON.stringify({ error: `An SOP with the title "${title.trim()}" already exists` }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare SOP data
    const sopData = {
      title: title.trim(),
      category_id,
      description: description?.trim() || null,
      status,
      procedure_steps: procedure_steps,
      important_notes: important_notes?.trim() || null,
      client_id,
      employee_id,
    }

    // Insert SOP into database
    const { data: createdSOP, error: insertError } = await supabaseClient
      .from('sop')
      .insert([sopData])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating SOP:', insertError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create SOP', 
          details: insertError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: createdSOP,
        message: 'SOP created successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-sop function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})



