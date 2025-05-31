
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface CloseIncidentRequest {
  client_id: string
  incident_id: string
  root_cause_analysis: string
  action_taken: string
  contributing_factor: any[]
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

    //console.log('User attempting to close incident:', user.id)

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

    //console.log('Closing incident with payload:', requestBody)

    // Verify the incident exists and belongs to the client
    const { data: incident, error: fetchError } = await supabase
      .from('incidents')
      .select('id, client_id, status_id, ticket_id')
      .eq('id', requestBody.incident_id)
      .eq('client_id', requestBody.client_id)
      .single()

    if (fetchError || !incident) {
      console.error('Error fetching incident:', fetchError)
      throw new Error('Incident not found or access denied')
    }

    //console.log('Found incident:', incident)

    // Get employee data to check permissions
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, is_super_admin, employee_type, client_id')
      .eq('user_id', user.id)
      .single()

    if (employeeError || !employee) {
      console.error('Error fetching employee data:', employeeError)
      throw new Error('Employee not found')
    }

    //console.log('Employee data:', employee)

    // Check permissions
    const canClose = employee.is_super_admin || 
                    employee.employee_type === 'admin' ||
                    employee.client_id === requestBody.client_id

    if (!canClose) {
      //console.log('Permission denied for user:', user.id)
      throw new Error('You do not have permission to close this incident')
    }

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

    //console.log('Closed status ID:', closedStatus.id)

    // Update the incident with closure data
    const { data: updatedIncident, error: updateError } = await supabase
      .from('incidents')
      .update({
        status_id: closedStatus.id,
        root_cause_analysis: requestBody.root_cause_analysis,
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

    //console.log('Successfully closed incident:', updatedIncident)

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
