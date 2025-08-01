
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { clientId, employeeId, isSuperAdmin } = await req.json();

    if (!clientId) {
      throw new Error('Client ID is required');
    }

    console.log('Fetching incidents for client:', clientId);
    console.log('Employee ID:', employeeId);
    console.log('Is Super Admin:', isSuperAdmin);

    // Build base query
    let query = supabaseClient
      .from('incidents')
      .select(`
        id,
        ticket_id,
        description,
        date,
        people_involved,
        documents,
        comments,
        created_at,
        updated_at,
        created_by,
        assigned_to,
        incident_report_types:type_id(id, name),
        incident_categories:category_id(id, name),
        incident_subcategories:subcategory_id(id, name),
        campuses:location_id(id, name),
        facilities:facility_id(id, name),
        incident_priorities:priority_id(id, name),
        incident_status:status_id(id, name),
        created_by_employee:employees!created_by(id, first_name, last_name),
        assigned_employee:employees!assigned_to(id, first_name, last_name)
      `)
      .eq('client_id', clientId);

    // Apply role-based filtering
    if (employeeId) {
      if (isSuperAdmin === true) {
        // Super admin can see all incidents for the client
        console.log('Super admin access: fetching all incidents for client');
      } else {
        // Non-super admin can only see incidents they created or are assigned to
        query = query.or(`created_by.eq.${employeeId},assigned_to.eq.${employeeId}`);
        console.log(`Regular user access: filtering for employee ${employeeId} (created_by OR assigned_to)`);
      }
    } else {
      // No employee ID provided - apply restrictive filter as safety measure
      console.log('No employee ID provided - applying restrictive filter');
      query = query.eq('created_by', 'non-existent-id');
    }

    // Execute query with ordering and limit
    query = query
      .order('created_at', { ascending: false })
      .limit(200);

    const { data: incidents, error } = await query;

    if (error) {
      console.error('Error fetching incidents:', error);
      throw new Error(`Failed to fetch incidents: ${error.message}`);
    }

    console.log(`Successfully fetched ${incidents?.length || 0} incidents for client ${clientId}`);
    console.log(`Access level: ${isSuperAdmin ? 'Super Admin (all incidents)' : 'Regular User (filtered incidents)'}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        incidents: incidents || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in fetch-incidents function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
