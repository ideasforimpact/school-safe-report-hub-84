
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

    const {
      typeId,
      categoryId,
      subcategoryId,
      description,
      date,
      locationId,
      facilityId,
      priorityId,
      peopleInvolved,
      documents,
      createdBy,
      assignedTo,
      clientId
    } = await req.json();

    console.log('Creating incident with optimized query');

    // Generate a ticket ID
    const ticketId = `INC-${Math.floor(10000 + Math.random() * 90000)}`;

    // Get the "Open" status ID with a simple, fast query
    const { data: statusData, error: statusError } = await supabaseClient
      .from('incident_status')
      .select('id')
      .eq('name', 'Open')
      .limit(1)
      .single();

    if (statusError || !statusData) {
      console.error('Error fetching Open status:', statusError);
      throw new Error('Could not fetch incident status');
    }

    // Prepare the incident record with minimal required fields first
    const incidentRecord = {
      ticket_id: ticketId,
      description: description || '',
      date: date,
      created_by: createdBy,
      status_id: statusData.id,
      client_id: clientId,
      people_involved: peopleInvolved || [],
      documents: documents || []
    };

    // Add optional fields only if they exist to reduce payload size
    if (typeId) incidentRecord.type_id = typeId;
    if (categoryId) incidentRecord.category_id = categoryId;
    if (subcategoryId) incidentRecord.subcategory_id = subcategoryId;
    if (locationId) incidentRecord.location_id = locationId;
    if (facilityId) incidentRecord.facility_id = facilityId;
    if (priorityId) incidentRecord.priority_id = priorityId;
    if (assignedTo) incidentRecord.assigned_to = assignedTo;

    console.log('Inserting incident with minimal payload');

    // Use a more efficient insert with select to get the created record
    const { data: incident, error: incidentError } = await supabaseClient
      .from('incidents')
      .insert(incidentRecord)
      .select('id, ticket_id')
      .single();

    if (incidentError) {
      console.error('Error creating incident:', incidentError);
      throw new Error(`Failed to create incident: ${incidentError.message}`);
    }

    console.log('Incident created successfully:', incident);

    return new Response(
      JSON.stringify({ 
        success: true, 
        incident: incident,
        ticketId: ticketId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-incident function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: 'Database operation timed out. Please try again.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
