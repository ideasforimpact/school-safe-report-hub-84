
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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

    console.log('Creating incident with data:', {
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
    });

    // Generate a ticket ID
    const ticketId = `INC-${Math.floor(10000 + Math.random() * 90000)}`;

    // Get the "Open" status ID
    const { data: statusData, error: statusError } = await supabaseClient
      .from('incident_status')
      .select('id')
      .eq('name', 'Open')
      .single();

    if (statusError || !statusData) {
      console.error('Error fetching Open status:', statusError);
      throw new Error('Could not fetch incident status');
    }

    // Create the incident record - using created_by instead of reported_by_id to match the actual column name
    const incidentRecord = {
      ticket_id: ticketId,
      type_id: typeId,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      description: description,
      date: date,
      location_id: locationId,
      facility_id: facilityId,
      priority_id: priorityId,
      people_involved: peopleInvolved,
      documents: documents,
      created_by: createdBy, // This should reference employees table
      assigned_to: assignedTo,
      status_id: statusData.id,
      client_id: clientId
    };

    console.log('Inserting incident record:', incidentRecord);

    const { data: incident, error: incidentError } = await supabaseClient
      .from('incidents')
      .insert(incidentRecord)
      .select()
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
        error: error.message || 'An unexpected error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
