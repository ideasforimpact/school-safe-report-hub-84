import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'
import { closureAttachmentsToDocuments } from '../_shared/closureAttachments.ts'

const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey())

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid authentication')
    }

    const body = await req.json()
    const incidentId = body?.incident_id as string | undefined
    if (!incidentId) {
      throw new Error('incident_id is required')
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, client_id')
      .eq('user_id', user.id)
      .single()

    if (employeeError || !employee) {
      console.error('Error fetching employee data:', employeeError)
      throw new Error('Employee not found')
    }

    const { data: incidentRow, error: incidentFetchError } = await supabase
      .from('incidents')
      .select('id, client_id, closure_attachments')
      .eq('id', incidentId)
      .single()

    if (incidentFetchError || !incidentRow) {
      throw new Error('Incident not found')
    }

    if (incidentRow.client_id !== employee.client_id) {
      throw new Error('Incident not found or access denied')
    }

    const documents = closureAttachmentsToDocuments(
      supabase,
      incidentRow.closure_attachments
    )

    return new Response(
      JSON.stringify({
        success: true,
        documents,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error in get-closure-documents:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
