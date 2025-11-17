
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = getSupabaseUrl()
    const supabaseKey = getSupabaseServiceRoleKey()
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Checking 1");
    
    // Parse request body
    const { client_id, incident_id, comment, documents } = await req.json()
    
    console.log('Add comment request:', { client_id, incident_id, comment, documents })

    // Validate required fields
    if (!client_id) {
      return new Response(
        JSON.stringify({ error: 'client_id is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!incident_id) {
      return new Response(
        JSON.stringify({ error: 'incident_id is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!comment || comment.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'comment text is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify that the incident exists and belongs to the specified client
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('id, client_id, comments')
      .eq('id', incident_id)
      .eq('client_id', client_id)
      .single()

    if (incidentError || !incident) {
      console.error('Incident verification error:', incidentError)
      return new Response(
        JSON.stringify({ error: 'Incident not found or access denied' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get current user from auth header
    const authHeader = req.headers.get('authorization')
    let currentUser = null
    let currentUserName = 'System User' // fallback
    let currentUserId = 'system'
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      currentUser = user
      
      if (currentUser) {
        currentUserId = currentUser.id
        
        // Try to get real name from employees table
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('first_name, last_name, email')
          .eq('user_id', currentUser.id)
          .single()
        
        if (employee && !employeeError) {
          // Use real name from employees table
          currentUserName = `${employee.first_name} ${employee.last_name}`.trim()
          console.log('Found employee name:', currentUserName)
        } else {
          console.log('Employee not found, trying auth user metadata')
          
          // Fallback: try to get name from auth user metadata
          const firstName = currentUser.user_metadata?.first_name || currentUser.user_metadata?.firstName
          const lastName = currentUser.user_metadata?.last_name || currentUser.user_metadata?.lastName
          
          if (firstName || lastName) {
            currentUserName = `${firstName || ''} ${lastName || ''}`.trim()
          } else if (currentUser.email) {
            // Last fallback: use email as display name
            currentUserName = currentUser.email
          }
          
          console.log('Using fallback name:', currentUserName)
        }
      }
    }

    // Create new comment object with file storage URLs instead of base64
    const newComment = {
      id: crypto.randomUUID(),
      description: comment.trim(),
      dueDate: new Date().toISOString(),
      assignedTo: { id: currentUserId, name: currentUserName },
      status: 'Pending',
      createdBy: { id: currentUserId, name: currentUserName },
      files: (documents || []).map((doc: any) => ({
        id: crypto.randomUUID(),
        name: doc.name || doc,
        type: doc.type || 'application/octet-stream',
        size: doc.size || 0,
        url: doc.url || '',
        path: doc.path || ''
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log('Creating comment with user name:', currentUserName)

    // Get existing comments and add the new one
    const existingComments = incident.comments || []
    const updatedComments = [...existingComments, newComment]

    // Update the incident with the new comment
    const { data: updatedIncident, error: updateError } = await supabase
      .from('incidents')
      .update({ 
        comments: updatedComments,
        updated_at: new Date().toISOString()
      })
      .eq('id', incident_id)
      .eq('client_id', client_id)
      .select()

    if (updateError) {
      console.error('Error updating incident with comment:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to add comment to incident' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Comment added successfully with real user name:', newComment.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        comment: newComment,
        message: 'Comment added successfully' 
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in add-incident-comment function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
