
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

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
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    );

    const body = await req.json();
    const { clientId, employeeId, isSuperAdmin, action, studentId } = body;

    if (!clientId) {
      throw new Error('Client ID is required');
    }

    // Validate IP whitelist
    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(
      supabaseClient,
      req,
      clientId,
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

    // Handle 'check-references' action
    if (action === 'check-references') {
      if (!studentId) {
        throw new Error('Student ID is required for check-references action');
      }

      console.log(`Checking incident references for student ${studentId} (Client: ${clientId})`);
      
      const { data: matchingIncidents, error: refError } = await supabaseClient
        .from('incidents')
        .select('id, people_involved')
        .eq('client_id', clientId)
        .not('people_involved', 'is', null);

      if (refError) throw refError;

      const filteredIncidents = (matchingIncidents || []).filter(incident => {
        if (!incident.people_involved) return false;
        const people = Array.isArray(incident.people_involved) ? incident.people_involved : [];
        return people.some((person: any) => {
          const personIdStr = String(person?.id || '').trim();
          const searchIdStr = String(studentId || '').trim();
          return personIdStr === searchIdStr && person?.role === 'Student';
        });
      });

      const count = filteredIncidents.length;
      
      return new Response(
        JSON.stringify({
          success: true,
          hasReferences: count > 0,
          count: count,
          message: count > 0 
            ? `This student is linked to ${count} incident(s) and cannot be deleted.`
            : ''
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
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
        recommended_action,
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

    const { data: incidents, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching incidents:', fetchError);
      throw new Error(`Failed to fetch incidents: ${fetchError.message}`);
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
