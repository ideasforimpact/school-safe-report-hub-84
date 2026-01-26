import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteSOPRequest {
  sop_id: string;
  client_id: string;
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
    const requestData: DeleteSOPRequest = await req.json()
    const { sop_id, client_id } = requestData

    // Validate required fields
    if (!sop_id) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'sop_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'client_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate SOP exists and belongs to the client
    const { data: sop, error: sopError } = await supabaseClient
      .from('sop')
      .select('id, title, client_id')
      .eq('id', sop_id)
      .eq('client_id', client_id)
      .single()

    if (sopError || !sop) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'SOP not found or does not belong to this client' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if SOP is assigned to any groups
    const { data: assignments, error: assignmentsError } = await supabaseClient
      .from('sop_assigned')
      .select('id')
      .eq('sop_id', sop_id)
      .not('group_id', 'is', null)
      .limit(1)

    if (assignmentsError) {
      console.error('Error checking assignments:', assignmentsError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check SOP assignments', 
          details: assignmentsError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (assignments && assignments.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Cannot delete SOP', 
          details: 'This SOP is assigned to one or more groups. Please remove all assignments before deleting.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Delete SOP from database
    const { error: deleteError } = await supabaseClient
      .from('sop')
      .delete()
      .eq('id', sop_id)
      .eq('client_id', client_id)

    if (deleteError) {
      console.error('Error deleting SOP:', deleteError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete SOP', 
          details: deleteError.message 
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
        message: 'SOP deleted successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in delete-sop function:', error)
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

