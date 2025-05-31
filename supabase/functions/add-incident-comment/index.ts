
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

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

    // Get current user from auth header (if available)
    const authHeader = req.headers.get('authorization')
    let currentUser = null
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      currentUser = user
    }

    // Create new comment object
    const newComment = {
      id: crypto.randomUUID(),
      description: comment.trim(),
      dueDate: new Date().toISOString(),
      assignedTo: { id: currentUser?.id || 'system', name: 'System User' },
      status: 'Pending',
      createdBy: { id: currentUser?.id || 'system', name: 'System User' },
      files: documents || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

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

    console.log('Comment added successfully:', newComment.id)

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
