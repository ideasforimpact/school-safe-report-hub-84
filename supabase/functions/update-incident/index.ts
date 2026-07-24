
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts'
import { getActiveClient } from '../_shared/getActiveClient.ts'

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceRoleKey()
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
  // Present only when the caller wants external-student links reconciled
  // (omit entirely for updates that don't touch people involved).
  externalStudents?: ExternalStudentInput[]
}

interface ExternalStudentInput {
  external_student_id: string
  external_client_id: string | null
  name: string
  student_id?: string | null
  gender?: string | null
  email?: string | null
  status?: string | null
  grade_id?: string | null
  section_id?: string | null
  grades?: unknown
  sections?: unknown
  client_id?: string | null
}

// Creates/updates external_students records and reconciles their links to
// this incident in incident_external_students, all server-side with the
// service-role client. Returns the names of any students that failed to
// process (kept non-fatal, matching prior client-side per-student handling).
async function syncExternalStudents(
  incidentId: string,
  externalStudents: ExternalStudentInput[],
  applicationClientId: string
): Promise<string[]> {
  const failedNames: string[] = []
  const currentExternalStudentIds = externalStudents
    .map((s) => s.external_student_id)
    .filter(Boolean)

  // Remove links for external students no longer present in the submitted list
  const { data: currentLinks, error: fetchError } = await supabase
    .from('incident_external_students')
    .select('id, external_students(external_student_id)')
    .eq('incident_id', incidentId)
    .eq('client_id', applicationClientId)

  if (fetchError) {
    console.error('Error fetching current external student links:', fetchError)
  } else if (currentLinks && currentLinks.length > 0) {
    const idsToRemove = currentLinks
      .filter((link: any) => {
        const linkedId = link.external_students?.external_student_id
        return linkedId && !currentExternalStudentIds.includes(linkedId)
      })
      .map((link: any) => link.id)

    if (idsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('incident_external_students')
        .delete()
        .in('id', idsToRemove)

      if (deleteError) {
        console.error('Error removing external student links:', deleteError)
      } else {
        console.log('Removed external student links:', idsToRemove)
      }
    }
  }

  for (const student of externalStudents) {
    try {
      if (!student.external_student_id) {
        console.error('Skipping external student with missing external_student_id:', student)
        failedNames.push(student.name || 'Unknown')
        continue
      }

      const externalStudentRecord = {
        client_id: applicationClientId,
        external_client_id: student.external_client_id,
        external_student_id: student.external_student_id,
        student_id: student.student_id,
        name: student.name,
        is_external: true,
        is_active: true,
        student_info: {
          gender: student.gender ?? null,
          email: student.email ?? null,
          status: student.status ?? null,
          grade_id: student.grade_id ?? null,
          section_id: student.section_id ?? null,
          grades: student.grades ?? null,
          sections: student.sections ?? null,
          client_id: student.client_id ?? null
        },
        updated_at: new Date().toISOString()
      }

      const { data: existingExternalStudent, error: checkError } = await supabase
        .from('external_students')
        .select('id')
        .eq('external_student_id', student.external_student_id)
        .eq('client_id', applicationClientId)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing external student:', checkError)
        failedNames.push(student.name || 'Unknown')
        continue
      }

      let externalStudentTableId: string

      if (existingExternalStudent) {
        const { data: updated, error: updateError } = await supabase
          .from('external_students')
          .update(externalStudentRecord)
          .eq('id', existingExternalStudent.id)
          .select('id')
          .single()

        if (updateError || !updated) {
          console.error('Error updating external student:', updateError)
          failedNames.push(student.name || 'Unknown')
          continue
        }
        externalStudentTableId = updated.id
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('external_students')
          .insert({ ...externalStudentRecord, created_at: new Date().toISOString() })
          .select('id')
          .single()

        if (insertError || !inserted) {
          console.error('Error inserting external student:', insertError)
          failedNames.push(student.name || 'Unknown')
          continue
        }
        externalStudentTableId = inserted.id
      }

      const { error: linkError } = await supabase
        .from('incident_external_students')
        .upsert({
          incident_id: incidentId,
          external_student_id: externalStudentTableId,
          external_client_id: student.external_client_id,
          client_id: applicationClientId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'incident_id,external_student_id' })

      if (linkError) {
        console.error('Error linking external student to incident:', linkError)
        failedNames.push(student.name || 'Unknown')
      }
    } catch (err) {
      console.error('Error processing external student:', err)
      failedNames.push(student.name || 'Unknown')
    }
  }

  return failedNames
}

// Helper function to check incident permissions
async function checkIncidentPermissions(
  incidentId: string,
  employeeId: string,
  clientId: string
): Promise<{ canEdit: boolean, incident: any }> {
  // Get the incident details with creator and assigned user
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .select('id, created_by, assigned_to, client_id, ticket_id')
    .eq('id', incidentId)
    .eq('client_id', clientId)
    .single()

  if (incidentError || !incident) {
    console.error('Error fetching incident:', incidentError)
    return { canEdit: false, incident: null }
  }

  // Get employee details to check admin status. Left join (not `!inner`) —
  // an inner join here drops the row entirely for employees (including super
  // admins) with zero employee_modules rows, making `.single()` fail with
  // "no rows returned" before the is_super_admin bypass below ever runs.
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select(`
      id,
      is_super_admin,
      client_id,
      employee_modules(
        level,
        module:modules(name)
      )
    `)
    .eq('id', employeeId)
    .eq('client_id', clientId)
    .maybeSingle()

  if (employeeError || !employee) {
    console.error('Error fetching employee:', employeeError)
    return { canEdit: false, incident }
  }

  // Check if user is super admin
  if (employee.is_super_admin) {
    console.log('User is super admin, allowing edit')
    return { canEdit: true, incident }
  }

  // Check if user has incident admin access
  const hasIncidentAdmin = employee.employee_modules?.some((empModule: any) => 
    empModule.module?.name?.toLowerCase() === 'incidents' && 
    empModule.level?.is_admin === true
  )

  console.log('Employee modules:', employee.employee_modules)
  console.log('Has incident admin:', hasIncidentAdmin)

  // Check if user created the incident
  const isCreator = incident.created_by === employeeId
  
  // Check if user is assigned to the incident
  const isAssigned = incident.assigned_to === employeeId

  console.log('Permission check:', {
    employeeId,
    createdBy: incident.created_by,
    assignedTo: incident.assigned_to,
    isCreator,
    isAssigned,
    hasIncidentAdmin
  })

  let canEdit = false

  if (hasIncidentAdmin) {
    // Incident admin can edit own + assigned incidents
    canEdit = isCreator || isAssigned
  } else {
    // Non-admin can only edit their own incidents
    canEdit = isCreator
  }

  return { canEdit, incident }
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

    const { incidentId, updates, changedBy, externalStudents }: UpdateIncidentRequest = await req.json()

    if (!incidentId) {
      throw new Error('Incident ID is required')
    }

    console.log('Updating incident:', incidentId, 'with updates:', updates)

    // Feature 3: resolve employee from JWT app_metadata. Multi-client users
    // have N rows under the same user_id; the legacy .single() throws.
    const { client_id: activeClientId, employee_id: activeEmployeeId } =
      await getActiveClient(supabase, user)
    if (!activeClientId || !activeEmployeeId) {
      console.error('Active employee not found for user', user.id)
      throw new Error('Employee not found')
    }
    const employee = { id: activeEmployeeId, client_id: activeClientId }

    // Validate IP whitelist
    if (employee.client_id) {
      const url = new URL(req.url);
      const ipValidation = await validateIPWhitelist(
        supabase,
        req,
        employee.client_id,
        url.pathname
      );
      
      if (!ipValidation.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'IP_NOT_WHITELISTED',
            message: 'Access denied. Your IP address is not whitelisted for this client.'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check permissions before allowing the update
    const { canEdit, incident } = await checkIncidentPermissions(
      incidentId,
      employee.id,
      employee.client_id
    )

    if (!canEdit) {
      console.log('Permission denied for user:', user.id, 'incident:', incidentId)
      throw new Error('You do not have permission to edit this incident')
    }

    console.log('Permission granted for update')

    // Prepare the update object efficiently
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only add fields that are provided
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        updateData[key] = value
      }
    })

    // Handle status_id lookup if provided as string
    if (updates.status_id && typeof updates.status_id === 'string') {
      console.log('Looking up status ID for name:', updates.status_id)
      const { data: statusData, error: statusError } = await supabase
        .from('incident_status')
        .select('id')
        .eq('name', updates.status_id)
        .single()
        
      if (statusError || !statusData) {
        console.error('Error fetching status:', statusError)
        throw new Error(`Status '${updates.status_id}' not found`)
      }
      
      console.log('Found status ID:', statusData.id)
      updateData.status_id = statusData.id
    }

    console.log('Final update data:', updateData)

    // Single optimized update query - the trigger will automatically log changes
    const { data: updatedIncident, error: updateError } = await supabase
      .from('incidents')
      .update(updateData)
      .eq('id', incidentId)
      .select('id, ticket_id')
      .single()

    if (updateError) {
      console.error('Error updating incident:', updateError)
      throw new Error(`Failed to update incident: ${updateError.message}`)
    }

    console.log('Successfully updated incident:', updatedIncident)

    // Reconcile external-student links (only when the caller included the
    // field at all — its absence means this update doesn't touch people
    // involved, so existing links must be left alone).
    let externalStudentFailures: string[] = []
    if (externalStudents !== undefined) {
      try {
        externalStudentFailures = await syncExternalStudents(incidentId, externalStudents, employee.client_id)
      } catch (externalStudentError) {
        console.error('Error syncing external students:', externalStudentError)
        // Don't fail the whole update if external-student sync fails
      }
    }

    // Log manual audit entries for non-field updates (like comments, documents)
    if (changedBy) {
      try {
        // Log document changes
        if (updates.documents) {
          await supabase.rpc('insert_incident_audit_log', {
            p_incident_id: incidentId,
            p_client_id: employee.client_id,
            p_field_changed: 'documents',
            p_changed_by: changedBy,
            p_change_type: 'action',
            p_description: 'Documents updated'
          })
        }

        // Log people involved changes
        if (updates.people_involved) {
          await supabase.rpc('insert_incident_audit_log', {
            p_incident_id: incidentId,
            p_client_id: employee.client_id,
            p_field_changed: 'people_involved',
            p_changed_by: changedBy,
            p_change_type: 'action',
            p_description: 'People involved updated'
          })
        }
      } catch (auditError) {
        console.error('Error logging manual audit entries:', auditError)
        // Don't fail the request if audit logging fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedIncident,
        externalStudentFailures
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
