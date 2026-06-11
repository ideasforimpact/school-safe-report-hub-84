
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to format client name for ticket ID
function formatClientNameForTicketId(clientName: string): string {
  if (!clientName || typeof clientName !== 'string') {
    return 'CLI'; // Default fallback
  }

  // Clean the client name (remove extra spaces, special characters)
  const cleanName = clientName.trim().replace(/[^a-zA-Z\s]/g, '');
  
  // Split into words
  const words = cleanName.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) {
    return 'CLI'; // Fallback if no valid words
  }
  
  if (words.length === 1) {
    // Single word: use first 3 characters
    const word = words[0];
    return word.substring(0, 3).toUpperCase();
  } else {
    // Multiple words: use first letter of each word
    return words.map(word => word.charAt(0).toUpperCase()).join('');
  }
}


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

    // Validate IP whitelist
    if (clientId) {
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
    }

    console.log('Creating incident with optimized approach');

    // Generate a ticket ID based on client name using optimized query
    // First, fetch the client name
    const { data: clientData, error: clientError } = await supabaseClient
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single();
    
    const clientName = clientData?.name || 'Unknown Client';
    const prefix = formatClientNameForTicketId(clientName);
    
    // Optimized query: Get the highest numbered ticket ID for this client prefix
    const { data: existingIncidents, error: incidentsError } = await supabaseClient
      .from('incidents')
      .select('ticket_id')
      .eq('client_id', clientId)
      .like('ticket_id', `${prefix}-%`)
      .order('ticket_id', { ascending: false })
      .limit(1);
    
    let nextNumber = 1; // Default to 001 for first ticket
    
    if (existingIncidents && existingIncidents.length > 0) {
      // Extract the number from the highest ticket ID
      const highestTicketId = existingIncidents[0].ticket_id;
      const match = highestTicketId.match(/-(\d+)$/);
      
      if (match) {
        const currentNumber = parseInt(match[1], 10);
        nextNumber = currentNumber + 1;
        console.log('Found existing ticket ID:', highestTicketId, 'Next number:', nextNumber);
      }
    } else {
      console.log('No existing ticket IDs found for prefix:', prefix, 'Starting with 001');
    }
    
    // Format with leading zeros (3 digits)
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    const ticketId = `${prefix}-${formattedNumber}`;

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
