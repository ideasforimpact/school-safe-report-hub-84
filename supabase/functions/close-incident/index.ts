
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
  closer_first_name?: string
  closer_last_name?: string
  notification_base_url?: string
}

// Helper function to check incident close permissions
async function checkClosePermissions(
  incidentId: string,
  employeeId: string,
  clientId: string
): Promise<{ canClose: boolean; incident: any }> {
  // Get the incident details with creator and assigned user
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .select('id, created_by, assigned_to, client_id, ticket_id, status_id')
    .eq('id', incidentId)
    .eq('client_id', clientId)
    .single()

  if (incidentError || !incident) {
    console.error('Error fetching incident:', incidentError)
    return { canClose: false, incident: null }
  }

  // Get employee details to check admin status
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, is_super_admin, client_id')
    .eq('id', employeeId)
    .eq('client_id', clientId)
    .single()

  if (employeeError || !employee) {
    console.error('Error fetching employee:', employeeError)
    return { canClose: false, incident }
  }

  console.log('Employee details:', {
    employeeId: employee.id,
    isSuperAdmin: employee.is_super_admin,
    clientId: employee.client_id,
  })

  let hasIncidentAdmin = false

  // Check module access based on employee type
  if (employee.is_super_admin) {
    console.log('Checking super admin permissions via client_modules')

    // For super admins: Check client_modules for incidents module
    const { data: clientModules, error: clientModuleError } = await supabase
      .from('client_modules')
      .select(`
        enabled,
        access_level,
        module:modules(name)
      `)
      .eq('client_id', clientId)
      .eq('enabled', true)

    if (clientModuleError) {
      console.error('Error fetching client modules:', clientModuleError)
      return { canClose: false, incident }
    }

    console.log('Client modules found:', clientModules)

    // Check if incidents module is enabled and has admin access
    hasIncidentAdmin =
      clientModules?.some(
        (clientModule: any) =>
          clientModule.module?.name?.toLowerCase() === 'incidents' &&
          clientModule.access_level?.isAdmin === true &&
          clientModule.enabled === true
      ) || false

    console.log('Super admin incident access:', hasIncidentAdmin)
  } else {
    console.log('Checking normal employee permissions via employee_modules')

    // For normal employees: Check employee_modules for incidents module
    const { data: employeeModules, error: employeeModuleError } = await supabase
      .from('employee_modules')
      .select(`
        level,
        module:modules(name)
      `)
      .eq('employee_id', employeeId)

    if (employeeModuleError) {
      console.error('Error fetching employee modules:', employeeModuleError)
      return { canClose: false, incident }
    }

    console.log('Employee modules found:', employeeModules)

    // Check if user has incident admin access
    hasIncidentAdmin =
      employeeModules?.some(
        (empModule: any) =>
          empModule.module?.name?.toLowerCase() === 'incidents' &&
          empModule.level?.is_admin === true
      ) || false

    console.log('Normal employee incident admin access:', hasIncidentAdmin)
  }

  // Check if user created the incident
  const isCreator = incident.created_by === employeeId

  // Check if user is assigned to the incident
  const isAssigned = incident.assigned_to === employeeId

  console.log('Close permission check:', {
    employeeId,
    isSuperAdmin: employee.is_super_admin,
    createdBy: incident.created_by,
    assignedTo: incident.assigned_to,
    isCreator,
    isAssigned,
    hasIncidentAdmin,
  })

  let canClose = false

  // Super admins can close any incident
  if (employee.is_super_admin) {
    canClose = true
  } else if (hasIncidentAdmin) {
    // Incident admin can close own + assigned incidents
    canClose = isCreator || isAssigned
  } else {
    // Non-admin can only close their own incidents
    canClose = isCreator
  }

  console.log('Final permission decision:', { canClose })

  return { canClose, incident }
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

async function sendClosureNotification(
  incidentId: string,
  clientId: string,
  ticketId: string,
  description: string,
  assignedTo: string | null,
  closerEmployeeId: string,
  closerName: string,
  notificationBaseUrl: string
): Promise<void> {
  try {
    if (!assignedTo || assignedTo === closerEmployeeId) return

    const { data: assignee } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, status')
      .eq('id', assignedTo)
      .single()

    if (!assignee?.status || !assignee?.email) return

    const assigneeName = `${assignee.first_name} ${assignee.last_name}`
    const closedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
    const incidentUrl = notificationBaseUrl ? `${notificationBaseUrl}/incidents/${incidentId}` : ''

    const subject = `Incident Closed – [Incident ID: ${ticketId}]`
    const body = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
<div style="background-color:#f0fdf4;padding:20px;border-radius:8px 8px 0 0;">
<h2 style="margin:0;color:#1f2937;font-size:24px;">Incident Closed</h2>
</div>
<div style="background-color:#ffffff;padding:24px;border:1px solid #e5e7eb;">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>${assigneeName}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">The following incident has been successfully closed:</p>
<div style="background-color:#f9fafb;padding:16px;border-radius:6px;border-left:4px solid #10b981;margin:20px 0;">
<p style="margin:6px 0;"><strong>Incident ID:</strong> ${ticketId}</p>
<p style="margin:6px 0;"><strong>Title:</strong> ${description}</p>
<p style="margin:6px 0;"><strong>Closed By:</strong> ${closerName}</p>
<p style="margin:6px 0;"><strong>Closure Date:</strong> ${closedDate}</p>
</div>
${incidentUrl ? `<p style="margin:20px 0;font-size:16px;color:#6b7280;">No further action is required. <a href="${incidentUrl}" style="color:#10b981;text-decoration:none;"><strong>Click Here</strong></a> to view the closed incident.</p>` : ''}
</div>
<div style="background-color:#f9fafb;padding:16px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;border-top:none;">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`

    const { data: emailData } = await supabase
      .from('email_queue')
      .insert({
        module_name: 'incident',
        notification_type: 'incident_closed',
        client_id: clientId,
        recipient_email: assignee.email,
        recipient_name: assigneeName,
        subject,
        body,
        params: {},
        priority: 0,
        is_sent: false,
        retry_count: 0,
        max_retries: 3,
        scheduled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    await supabase
      .from('notification_logs')
      .insert({
        module: 'incident',
        type: 'incident_closed',
        recipient_id: assignee.id,
        recipient_email: assignee.email,
        subject,
        body,
        status: emailData ? 'pending' : 'failed',
        metadata: { incidentId, closedBy: closerEmployeeId }
      })
  } catch (err) {
    console.error('Closure notification error (non-fatal):', err)
  }
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

    const { canClose, incident } = await checkClosePermissions(
      requestBody.incident_id,
      employee.id,
      requestBody.client_id
    )

    if (!canClose) {
      console.log(
        'Permission denied for user:',
        user.id,
        'to close incident:',
        requestBody.incident_id
      )
      throw new Error('You do not have permission to close this incident')
    }

    console.log('Permission granted for close')

    if (!incident) {
      throw new Error('Incident not found or access denied')
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

    // Send closure notification server-side (non-blocking)
    const closerName = [requestBody.closer_first_name, requestBody.closer_last_name]
      .filter(Boolean).join(' ') || 'User'
    sendClosureNotification(
      requestBody.incident_id,
      requestBody.client_id,
      incident.ticket_id || '',
      updatedIncident.description || 'Incident',
      incident.assigned_to || null,
      employee.id,
      closerName,
      requestBody.notification_base_url || ''
    )

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
