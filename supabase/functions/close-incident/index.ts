
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

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

async function uploadClosureAttachments(
  clientId: string,
  incidentId: string,
  files: Array<{ name: string; type?: string; size?: number; base64: string }>
) {
  const rows: Array<Record<string, unknown>> = []

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

    const { data } = supabase.storage.from('incident-closure-attachments').getPublicUrl(path)

    rows.push({
      incident_id: incidentId,
      client_id: clientId,
      file_name: file.name || safeName,
      file_type: file.type || null,
      file_size: file.size || 0,
      storage_bucket: 'incident-closure-attachments',
      storage_path: path,
      file_url: data.publicUrl,
    })
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('incident_closure_attachments').insert(rows)
    if (error) {
      throw new Error(`Failed to save attachment metadata: ${error.message}`)
    }
  }
}

async function deleteClosureAttachments(
  clientId: string,
  incidentId: string,
  attachmentIds: string[]
) {
  const ids = (attachmentIds || []).filter(Boolean)
  if (ids.length === 0) return

  const { data: existing, error: fetchError } = await supabase
    .from('incident_closure_attachments')
    .select('id, storage_bucket, storage_path')
    .eq('client_id', clientId)
    .eq('incident_id', incidentId)
    .in('id', ids)

  if (fetchError) {
    throw new Error(`Failed to load attachments for deletion: ${fetchError.message}`)
  }

  for (const row of existing || []) {
    if (row.storage_bucket && row.storage_path) {
      await supabase.storage.from(row.storage_bucket).remove([row.storage_path])
    }
  }

  const { error: deleteError } = await supabase
    .from('incident_closure_attachments')
    .delete()
    .eq('client_id', clientId)
    .eq('incident_id', incidentId)
    .in('id', ids)

  if (deleteError) {
    throw new Error(`Failed to delete attachment metadata: ${deleteError.message}`)
  }
}

// Helper function to check incident close permissions
async function checkClosePermissions(
  incidentId: string,
  employeeId: string,
  clientId: string
): Promise<{ canClose: boolean, incident: any }> {
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
    clientId: employee.client_id
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
    hasIncidentAdmin = clientModules?.some((clientModule: any) => 
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
    hasIncidentAdmin = employeeModules?.some((empModule: any) => 
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
    hasIncidentAdmin
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

    // Get employee data for permission checking
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, client_id')
      .eq('user_id', user.id)
      .single()

    if (employeeError || !employee) {
      console.error('Error fetching employee data:', employeeError)
      throw new Error('Employee not found')
    }

    let canClose = true;
    // Check permissions before allowing the close
    // const { canClose, incident } = await checkClosePermissions(
    //   requestBody.incident_id,
    //   employee.id,
    //   requestBody.client_id
    // )

    if (!canClose) {
      console.log('Permission denied for user:', user.id, 'to close incident:', requestBody.incident_id)
      throw new Error('You do not have permission to close this incident')
    }

    console.log('Permission granted for close')

    // Verify the incident exists and belongs to the client
    // if (!incident) {
    //   throw new Error('Incident not found or access denied')
    // }

    // console.log('Found incident:', incident)

    // Get the "Closed" status ID
    const { data: closedStatus, error: statusError } = await supabase
      .from('incident_status')
      .select('id')
      .eq('name', 'Closed')
      .single()

    if (statusError || !closedStatus) {
      console.error('Error fetching closed status:', statusError)
      throw new Error('Could not find Closed status')
    }

    console.log('Closed status ID:', closedStatus.id)

    // Update the incident with closure data
    const { data: updatedIncident, error: updateError } = await supabase
      .from('incidents')
      .update({
        status_id: closedStatus.id,
        root_cause_analysis: requestBody.root_cause_analysis,
        learning_points: requestBody.learning_points || null,
        action_taken: requestBody.action_taken,
        contributing_factor: requestBody.contributing_factor,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestBody.incident_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating incident:', updateError)
      throw new Error(`Failed to close incident: ${updateError.message}`)
    }

    console.log('Successfully closed incident:', updatedIncident)

    if (requestBody.deleted_attachment_ids && requestBody.deleted_attachment_ids.length > 0) {
      await deleteClosureAttachments(
        employee.client_id,
        requestBody.incident_id,
        requestBody.deleted_attachment_ids
      )
    }

    if (requestBody.attachments && requestBody.attachments.length > 0) {
      await uploadClosureAttachments(
        employee.client_id,
        requestBody.incident_id,
        requestBody.attachments
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Incident closed successfully',
        data: updatedIncident 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in close-incident function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while closing the incident' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
