
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

import {
  parseClosureAttachments,
  type ClosureAttachmentRow,
} from '../_shared/closureAttachments.ts'

const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey())

interface CloseIncidentRequest {
  client_id: string
  incident_id: string
  root_cause_analysis: string
  learning_points?: string
  action_taken: string
  contributing_factor: any[]
  attachments?: Array<{
    name: string
    type?: string
    size?: number
    base64: string
  }>
  deleted_attachment_ids?: string[]
}

function base64ToBlob(base64: string, type: string): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type })
}

async function uploadNewClosureFiles(
  clientId: string,
  incidentId: string,
  files: Array<{ name: string; type?: string; size?: number; base64: string }>
): Promise<ClosureAttachmentRow[]> {
  const added: ClosureAttachmentRow[] = []

  for (const file of files || []) {
    if (!file.base64) continue

    const contentType = file.type || 'application/octet-stream'
    const blob = base64ToBlob(file.base64, contentType)
    const safeName = String(file.name || 'file').replace(/\s+/g, '-')
    const path = `${clientId}/${incidentId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('incident-closure-attachments')
      .upload(path, blob, {
        contentType,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Failed to upload attachment "${safeName}": ${uploadError.message}`)
    }

    added.push({
      id: crypto.randomUUID(),
      name: file.name || safeName,
      path,
      updatedAt: new Date().toISOString(),
    })
  }

  return added
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid authentication')
    }

    console.log('User attempting to close incident:', user.id)

    const requestBody: CloseIncidentRequest = await req.json()

    // Validate required fields
    if (!requestBody.client_id) {
      throw new Error('client_id is required')
    }

    if (!requestBody.incident_id) {
      throw new Error('incident_id is required')
    }

    if (!requestBody.root_cause_analysis || requestBody.root_cause_analysis.trim() === '') {
      throw new Error('root_cause_analysis is mandatory and cannot be empty')
    }

    if (!requestBody.action_taken || requestBody.action_taken.trim() === '') {
      throw new Error('action_taken is mandatory and cannot be empty')
    }

    if (!requestBody.contributing_factor || !Array.isArray(requestBody.contributing_factor) || requestBody.contributing_factor.length === 0) {
      throw new Error('contributing_factor is mandatory and must contain at least one factor')
    }

    console.log('Closing incident with payload:', requestBody)

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, client_id')
      .eq('user_id', user.id)
      .single()

    if (employeeError || !employee) {
      console.error('Error fetching employee data:', employeeError)
      throw new Error('Employee not found')
    }

    const canClose = true
    if (!canClose) {
      throw new Error('You do not have permission to close this incident')
    }

    const { data: incidentRow, error: incidentFetchError } = await supabase
      .from('incidents')
      .select('id, client_id, closure_attachments')
      .eq('id', requestBody.incident_id)
      .single()

    if (incidentFetchError || !incidentRow) {
      throw new Error('Incident not found')
    }

    if (incidentRow.client_id !== requestBody.client_id) {
      throw new Error('Incident not found or access denied')
    }

    let closureAttachments = parseClosureAttachments(incidentRow.closure_attachments)

    const deletedIds = new Set((requestBody.deleted_attachment_ids || []).filter(Boolean))
    closureAttachments = closureAttachments.filter((a) => !deletedIds.has(a.id))

    const newRows = await uploadNewClosureFiles(
      employee.client_id,
      requestBody.incident_id,
      requestBody.attachments || []
    )
    closureAttachments = [...closureAttachments, ...newRows]

    const { data: closedStatus, error: statusError } = await supabase
      .from('incident_status')
      .select('id')
      .eq('name', 'Closed')
      .single()

    if (statusError || !closedStatus) {
      console.error('Error fetching closed status:', statusError)
      throw new Error('Could not find Closed status')
    }

    const { data: updatedIncident, error: updateError } = await supabase
      .from('incidents')
      .update({
        status_id: closedStatus.id,
        root_cause_analysis: requestBody.root_cause_analysis,
        learning_points: requestBody.learning_points || null,
        action_taken: requestBody.action_taken,
        contributing_factor: requestBody.contributing_factor,
        closure_attachments: closureAttachments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestBody.incident_id)
      .eq('client_id', requestBody.client_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating incident:', updateError)
      throw new Error(`Failed to close incident: ${updateError.message}`)
    }

    console.log('Successfully closed incident:', updatedIncident)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Incident closed successfully',
        data: updatedIncident,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error in close-incident function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while closing the incident',
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
