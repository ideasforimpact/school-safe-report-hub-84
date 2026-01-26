import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateSOPRequest {
  sop_id: string;
  title: string;
  category_id: string;
  description?: string | null;
  status: boolean;
  procedure_steps: string[];
  important_notes?: string | null;
  client_id?: string | null;
  employee_id?: string | null;
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
    const requestData: UpdateSOPRequest = await req.json()
    const { sop_id, title, category_id, description, status, procedure_steps, important_notes, client_id, employee_id } = requestData

    // Validate required fields
    if (!sop_id) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'SOP ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

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

    // Validate SOP exists
    const { data: existingSOP, error: sopError } = await supabaseClient
      .from('sop')
      .select('id')
      .eq('id', sop_id)
      .single()

    if (sopError || !existingSOP) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'SOP not found' }),
        { 
          status: 404, 
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

    // Validate client_id if provided
    if (client_id) {
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
    }

    // Validate employee_id if provided
    if (employee_id) {
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
    }

    // Prepare update data
    const updateData = {
      title: title.trim(),
      category_id,
      description: description?.trim() || null,
      status,
      procedure_steps: procedure_steps,
      important_notes: important_notes?.trim() || null,
      client_id: client_id || null,
      employee_id: employee_id || null,
      updated_at: new Date().toISOString(),
    }

    // Update SOP in database
    const { data: updatedSOP, error: updateError } = await supabaseClient
      .from('sop')
      .update(updateData)
      .eq('id', sop_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating SOP:', updateError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update SOP', 
          details: updateError.message 
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
        data: updatedSOP,
        message: 'SOP updated successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in update-sop function:', error)
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



