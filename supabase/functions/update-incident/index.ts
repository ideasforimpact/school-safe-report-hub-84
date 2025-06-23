
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
  changedBy?: string
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

    console.log('User attempting to update incident:', user.id)

    const { incidentId, updates, changedBy }: UpdateIncidentRequest = await req.json()

    if (!incidentId) {
      throw new Error('Incident ID is required')
    }

    console.log('Updating incident:', incidentId, 'with updates:', updates)

    // Optimized: Get current incident and employee data in parallel
    const [incidentResult, employeeResult] = await Promise.all([
      supabase
        .from('incidents')
        .select('created_by, client_id')
        .eq('id', incidentId)
        .single(),
      supabase
        .from('employees')
        .select('id, is_super_admin, employee_type, client_id')
        .eq('user_id', user.id)
        .single()
    ]);

    const { data: currentIncident, error: fetchError } = incidentResult;
    const { data: employee, error: employeeError } = employeeResult;

    if (fetchError || !currentIncident) {
      console.error('Error fetching current incident:', fetchError);
      throw new Error('Incident not found');
    }

    if (employeeError || !employee) {
      console.error('Error fetching employee data:', employeeError);
      throw new Error('Employee not found');
    }

    console.log('Current incident:', currentIncident);
    console.log('Employee data:', employee);

    // Check permissions
    const canEdit = employee.is_super_admin || 
                   employee.employee_type === 'admin' ||
                   currentIncident.created_by === employee.id ||
                   (employee.client_id === currentIncident.client_id);

    if (!canEdit) {
      console.log('Permission denied for user:', user.id);
      throw new Error('You do not have permission to edit this incident');
    }

    // Prepare the update object efficiently
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only add fields that are provided
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        updateData[key] = value;
      }
    });

    // Handle status_id lookup if provided as string
    if (updates.status_id && typeof updates.status_id === 'string') {
      console.log('Looking up status ID for name:', updates.status_id);
      const { data: statusData, error: statusError } = await supabase
        .from('incident_status')
        .select('id')
        .eq('name', updates.status_id)
        .single();
        
      if (statusError || !statusData) {
        console.error('Error fetching status:', statusError);
        throw new Error(`Status '${updates.status_id}' not found`);
      }
      
      console.log('Found status ID:', statusData.id);
      updateData.status_id = statusData.id;
    }

    console.log('Final update data:', updateData);

    // Single optimized update query - the trigger will automatically log changes
    const { data: updatedIncident, error: updateError } = await supabase
      .from('incidents')
      .update(updateData)
      .eq('id', incidentId)
      .select('id, ticket_id')
      .single();

    if (updateError) {
      console.error('Error updating incident:', updateError);
      throw new Error(`Failed to update incident: ${updateError.message}`);
    }

    console.log('Successfully updated incident:', updatedIncident);

    // Log manual audit entries for non-field updates (like comments, documents)
    if (changedBy) {
      try {
        // Log document changes
        if (updates.documents) {
          await supabase.rpc('insert_incident_audit_log', {
            p_incident_id: incidentId,
            p_field_changed: 'documents',
            p_changed_by: changedBy,
            p_change_type: 'action',
            p_description: 'Documents updated'
          });
        }

        // Log people involved changes
        if (updates.people_involved) {
          await supabase.rpc('insert_incident_audit_log', {
            p_incident_id: incidentId,
            p_field_changed: 'people_involved',
            p_changed_by: changedBy,
            p_change_type: 'action',
            p_description: 'People involved updated'
          });
        }
      } catch (auditError) {
        console.error('Error logging manual audit entries:', auditError);
        // Don't fail the request if audit logging fails
      }
    }

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
    );

  } catch (error) {
    console.error('Error in update-incident function:', error);
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
    );
  }
});
