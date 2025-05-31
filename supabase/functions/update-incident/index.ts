
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface UpdateIncidentRequest {
  incidentId: string
  updates: {
    type_id?: string
    category_id?: string
    subcategory_id?: string
    description?: string
    date?: string
    location_id?: string
    facility_id?: string
    priority_id?: string
    status_id?: string
    assigned_to?: string
    people_involved?: any[]
    documents?: any[]
    root_cause_analysis?: string
    action_taken?: string
    contributing_factor?: any[]
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

    //console.log('User attempting to update incident:', user.id)

    const { incidentId, updates }: UpdateIncidentRequest = await req.json()

    if (!incidentId) {
      throw new Error('Incident ID is required')
    }

    //console.log('Updating incident:', incidentId, 'with updates:', updates)

    // First, get the current incident to check permissions
    const { data: currentIncident, error: fetchError } = await supabase
      .from('incidents')
      .select('created_by, client_id')
      .eq('id', incidentId)
      .single()

    if (fetchError || !currentIncident) {
      console.error('Error fetching current incident:', fetchError)
      throw new Error('Incident not found')
    }

    //console.log('Current incident:', currentIncident)

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
    const canEdit = employee.is_super_admin || 
                   employee.employee_type === 'admin' ||
                   currentIncident.created_by === employee.id ||
                   (employee.client_id === currentIncident.client_id)

    if (!canEdit) {
      //console.log('Permission denied for user:', user.id)
      throw new Error('You do not have permission to edit this incident')
    }

    // Prepare the update object
    const updateData: any = {}

    // Map the updates to the correct database fields
    if (updates.type_id) updateData.type_id = updates.type_id
    if (updates.category_id) updateData.category_id = updates.category_id
    if (updates.subcategory_id) updateData.subcategory_id = updates.subcategory_id
    if (updates.description) updateData.description = updates.description
    if (updates.date) updateData.date = updates.date
    if (updates.location_id) updateData.location_id = updates.location_id
    if (updates.facility_id) updateData.facility_id = updates.facility_id
    if (updates.priority_id) updateData.priority_id = updates.priority_id
    if (updates.assigned_to) updateData.assigned_to = updates.assigned_to
    if (updates.people_involved) updateData.people_involved = updates.people_involved
    if (updates.documents) updateData.documents = updates.documents
    
    // Handle new fields
    if (updates.root_cause_analysis !== undefined) updateData.root_cause_analysis = updates.root_cause_analysis
    if (updates.action_taken !== undefined) updateData.action_taken = updates.action_taken
    if (updates.contributing_factor !== undefined) updateData.contributing_factor = updates.contributing_factor

    // Handle status_id - look up the status ID by name
    if (updates.status_id) {
      //console.log('Looking up status ID for name:', updates.status_id)
      const { data: statusData, error: statusError } = await supabase
        .from('incident_status')
        .select('id')
        .eq('name', updates.status_id)
        .single()
        
      if (statusError || !statusData) {
        console.error('Error fetching status:', statusError)
        throw new Error(`Status '${updates.status_id}' not found`)
      }
      
      //console.log('Found status ID:', statusData.id)
      updateData.status_id = statusData.id
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    //console.log('Final update data:', updateData)

    // Update the incident
    const { data: updatedIncident, error: updateError } = await supabase
      .from('incidents')
      .update(updateData)
      .eq('id', incidentId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating incident:', updateError)
      throw new Error(`Failed to update incident: ${updateError.message}`)
    }

    //console.log('Successfully updated incident:', updatedIncident)

    return new Response(
      JSON.stringify({ 
        success: true, 
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
    console.error('Error in update-incident function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while updating the incident' 
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
