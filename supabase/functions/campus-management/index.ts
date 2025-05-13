
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

        const { data: campuses, error } = await supabase
          .from('campuses')
          .select('*')
          .eq('client_id', clientId);

        if (error) throw error;

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
        
        const { data: campus, error } = await supabase
          .from('campuses')
          .insert({ name, client_id: clientId })
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ campus }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
        
      case 'update': {
        const { id, name } = body;
        
        if (!id || !name) {
          return new Response(
            JSON.stringify({ error: 'ID and name are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        const { data: campus, error } = await supabase
          .from('campuses')
          .update({ name })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ campus }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
        
      case 'delete': {
        const { id } = body;
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        const { error } = await supabase
          .from('campuses')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
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
