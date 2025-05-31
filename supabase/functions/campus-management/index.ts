
// Follow Deno runtime API
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request data
    let body: any = {};
    if (req.method !== 'GET') {
      body = await req.json();
    }

    const action = req.method === 'GET' 
      ? new URL(req.url).searchParams.get('action') || 'list'
      : body.action || '';
    
    // Handle the different actions
    switch (action) {
      case 'list': {
        const clientId = req.method === 'GET'
          ? new URL(req.url).searchParams.get('clientId')
          : body.clientId;

        if (!clientId) {
          return new Response(
            JSON.stringify({ error: 'Client ID is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log(`Fetching campuses for client: ${clientId}`);

        const { data: campuses, error } = await supabase
          .from('campuses')
          .select('*')
          .eq('client_id', clientId);

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        console.log(`Successfully fetched ${campuses.length} campuses`);

        return new Response(
          JSON.stringify({ campuses }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
        
      case 'create': {
        const { name, clientId } = body;
        
        if (!name || !clientId) {
          return new Response(
            JSON.stringify({ error: 'Name and Client ID are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        console.log(`Creating campus "${name}" for client: ${clientId}`);
        
        const { data: campus, error } = await supabase
          .from('campuses')
          .insert({ name, client_id: clientId })
          .select()
          .single();
        
        if (error) {
          console.error('Database error:', error);
          throw error;
        }
        
        console.log(`Successfully created campus: ${campus.id}`);
        
        return new Response(
          JSON.stringify({ campus }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
        
      case 'update': {
        const { id, name, clientId } = body;
        
        if (!id || !name || !clientId) {
          return new Response(
            JSON.stringify({ error: 'ID, name, and Client ID are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        console.log(`Updating campus ${id} to "${name}" for client: ${clientId}`);
        
        // Verify the campus belongs to the client before updating
        const { data: existingCampus, error: checkError } = await supabase
          .from('campuses')
          .select('id')
          .eq('id', id)
          .eq('client_id', clientId)
          .single();
        
        if (checkError || !existingCampus) {
          return new Response(
            JSON.stringify({ error: 'Campus not found or access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }
        
        const { data: campus, error } = await supabase
          .from('campuses')
          .update({ name })
          .eq('id', id)
          .eq('client_id', clientId)
          .select()
          .single();
        
        if (error) {
          console.error('Database error:', error);
          throw error;
        }
        
        console.log(`Successfully updated campus: ${campus.id}`);
        
        return new Response(
          JSON.stringify({ campus }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
        
      case 'delete': {
        const { id, clientId } = body;
        
        if (!id || !clientId) {
          return new Response(
            JSON.stringify({ error: 'ID and Client ID are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        console.log(`Deleting campus ${id} for client: ${clientId}`);
        
        // Verify the campus belongs to the client before deleting
        const { data: existingCampus, error: checkError } = await supabase
          .from('campuses')
          .select('id')
          .eq('id', id)
          .eq('client_id', clientId)
          .single();
        
        if (checkError || !existingCampus) {
          return new Response(
            JSON.stringify({ error: 'Campus not found or access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }
        
        const { error } = await supabase
          .from('campuses')
          .delete()
          .eq('id', id)
          .eq('client_id', clientId);
        
        if (error) {
          console.error('Database error:', error);
          throw error;
        }
        
        console.log(`Successfully deleted campus: ${id}`);
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
