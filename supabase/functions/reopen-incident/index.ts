
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ReopenIncidentRequest {
  incident_id: string
  reopened_by: string
}

// Helper function to check incident reopen permissions
async function checkReopenPermissions(
  incidentId: string,
  employeeId: string
): Promise<{ canReopen: boolean, incident: any, clientId: string }> {
  // Get the incident details with creator and assigned user
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .select('id, created_by, assigned_to, client_id, ticket_id, status_id')
    .eq('id', incidentId)
    .single()

  if (incidentError || !incident) {
    console.error('Error fetching incident:', incidentError)
    return { canReopen: false, incident: null, clientId: '' }
  }

  // Get employee details first
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, is_super_admin, client_id')
    .eq('id', incident.created_by)
    .eq('client_id', incident.client_id)
    .single()

  if (employeeError || !employee) {
    console.error('Error fetching employee:', employeeError)
    return { canReopen: false, incident, clientId: incident.client_id }
  }

  let hasIncidentAdmin = false

  // Check incident admin access based on user type
  if (employee.is_super_admin) {
    console.log('Checking super admin incident module access from client_modules')
    // For super admin, check client_modules
    const { data: clientModules, error: clientModulesError } = await supabase
      .from('client_modules')
      .select(`
        enabled,
        access_level,
        module:modules(name)
      `)
      .eq('client_id', employee.client_id)
      .eq('enabled', true)

    if (clientModulesError) {
      console.error('Error fetching client modules:', clientModulesError)
    } else {
      hasIncidentAdmin = clientModules?.some((clientModule: any) => 
        clientModule.module?.name?.toLowerCase() === 'incidents' && 
        clientModule.access_level?.isAdmin === true
      ) || false
    }
  } else {
    console.log('Checking regular employee incident module access from employee_modules')
    // For regular employee, check employee_modules
    const { data: employeeModules, error: employeeModulesError } = await supabase
      .from('employee_modules')
      .select(`
        level,
        module:modules(name)
      `)
      .eq('employee_id', employee.id)

    if (employeeModulesError) {
      console.error('Error fetching employee modules:', employeeModulesError)
    } else {
      hasIncidentAdmin = employeeModules?.some((empModule: any) => 
        empModule.module?.name?.toLowerCase() === 'incidents' && 
        empModule.level?.is_admin === true
      ) || false
    }
  }

  // Check if user created the incident
  const isCreator = incident.created_by === employee.id
  
  // Check if user is assigned to the incident
  const isAssigned = incident.assigned_to === employee.id

  console.log('Reopen permission check:', {
    employeeId,
    createdBy: incident.created_by,
    assignedTo: incident.assigned_to,
    isCreator,
    isAssigned,
    hasIncidentAdmin
  })

  let canReopen = false

  if (hasIncidentAdmin) {
    // Incident admin can reopen own + assigned incidents
    canReopen = isCreator || isAssigned
  } else {
    // Non-admin can only reopen their own incidents
    canReopen = isCreator
  }

  return { canReopen, incident, clientId: incident.client_id }
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

    const { incident_id, reopened_by }: ReopenIncidentRequest = await req.json()

    if (!incident_id) {
      throw new Error('incident_id is required')
    }

    if (!reopened_by) {
      throw new Error('reopened_by is required')
    }

    console.log('Reopening incident:', { incident_id, reopened_by })

    // Check permissions before allowing the reopen
    const { canReopen, incident, clientId } = await checkReopenPermissions(
      incident_id,
      reopened_by
    )

    if (!canReopen) {
      console.log('Permission denied for user:', reopened_by, 'to reopen incident:', incident_id)
      throw new Error('You do not have permission to reopen this incident')
    }

    console.log('Permission granted for reopen')

    if (!incident) {
      return {
        success: false,
        message: 'Incident not found'
      }
    }

    // Get the "Open" status ID from the incident_status table
    const { data: openStatus, error: statusError } = await supabase
      .from('incident_status')
      .select('id')
      .eq('name', 'Open')
      .single()

    if (statusError || !openStatus) {
      console.error('Error finding Open status:', statusError)
      return {
        success: false,
        message: 'Unable to find Open status'
      }
    }

    // Check if incident is currently closed
    const { data: closedStatus, error: closedStatusError } = await supabase
      .from('incident_status')
      .select('id')
      .eq('name', 'Closed')
      .single()

    if (closedStatusError || !closedStatus) {
      console.error('Error finding Closed status:', closedStatusError)
      return {
        success: false,
        message: 'Unable to find Closed status'
      }
    }

    if (incident.status_id !== closedStatus.id) {
      return {
        success: false,
        message: 'Only closed incidents can be reopened'
      }
    }

    // Calculate new reopen count
    const newReopenCount = (incident.reopen || 0) + 1

    // Update the incident to reopen it
    const { data: updatedIncident, error: updateError } = await supabase
      .from('incidents')
      .update({
        status_id: openStatus.id,
        reopen: newReopenCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', incident_id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error reopening incident:', updateError)
      return {
        success: false,
        message: 'Failed to reopen incident'
      }
    }

    // Add an audit log entry for the reopen action
    const { error: auditError } = await supabase.rpc('insert_incident_audit_log', {
      p_incident_id: incident_id,
      p_client_id: clientId,
      p_field_changed: 'status_reopen',
      p_old_value: 'Closed',
      p_new_value: `Open (Reopened ${newReopenCount} time${newReopenCount > 1 ? 's' : ''})`,
      p_changed_by: reopened_by,
      p_change_type: 'reopen',
      p_description: `Incident reopened for the ${newReopenCount}${newReopenCount === 1 ? 'st' : newReopenCount === 2 ? 'nd' : newReopenCount === 3 ? 'rd' : 'th'} time`
    })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      // Don't fail the operation if audit log fails
    }

    console.log('Incident reopened successfully:', updatedIncident)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Incident ${incident.ticket_id} has been reopened successfully`,
        incident: updatedIncident
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Unexpected error reopening incident:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'An unexpected error occurred while reopening the incident'
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
