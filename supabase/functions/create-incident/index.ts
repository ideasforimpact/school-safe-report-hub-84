
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

    console.log('Creating incident with optimized approach');

    // Generate a ticket ID
    const ticketId = `INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Use a single efficient query to get the "Open" status ID
    const { data: statusData, error: statusError } = await supabaseClient
      .from('incident_status')
      .select('id')
      .eq('name', 'Open')
      .single();

    if (statusError || !statusData) {
      console.error('Error fetching Open status:', statusError);
      throw new Error('Could not fetch incident status');
    }

    // Prepare the incident record with all data - start with empty documents array
    const incidentRecord = {
      ticket_id: ticketId,
      description: description || '',
      date: date,
      created_by: createdBy,
      status_id: statusData.id,
      client_id: clientId,
      people_involved: peopleInvolved || [],
      documents: [], // Initialize with empty array, documents will be uploaded separately
      type_id: typeId || null,
      category_id: categoryId || null,
      subcategory_id: subcategoryId || null,
      location_id: locationId || null,
      facility_id: facilityId || null,
      priority_id: priorityId || null,
      assigned_to: assignedTo || null
    };

    console.log('Inserting incident with single query');

    // Single optimized insert
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

    // Note: Documents will be uploaded separately using the frontend document service
    // with the new hierarchical path structure: incidents/{clientId}/{incidentId}/

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
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
