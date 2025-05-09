
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ClientData {
  id?: string;
  name: string;
  email?: string;
  contact_person?: string;
  phone?: string;
  active: boolean;
  logo?: string;
  institution_type?: string;
  allowed_domains?: string;
  auth_providers?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get the route to determine operation
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const operation = pathParts[pathParts.length - 1];

  try {
    // Process requests based on the operation
    if (req.method === 'GET') {
      if (operation === 'clients') {
        // Get all clients
        const { data, error } = await supabase
          .from('clients')
          .select('*');

        if (error) throw error;

        return new Response(JSON.stringify({ clients: data }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } else if (operation === 'client') {
        // Get client by ID
        const id = url.searchParams.get('id');
        if (!id) {
          return new Response(JSON.stringify({ error: 'Client ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ client: data }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      }
    } else if (req.method === 'POST') {
      const requestData = await req.json();

      if (operation === 'create') {
        // Create a new client
        const clientData: ClientData = requestData.client;

        const { data, error } = await supabase
          .from('clients')
          .insert([clientData])
          .select();

        if (error) throw error;

        return new Response(JSON.stringify({ client: data[0] }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 201,
        });
      } else if (operation === 'update') {
        // Update an existing client
        const { id, ...updates } = requestData.client;

        if (!id) {
          return new Response(JSON.stringify({ error: 'Client ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        const { data, error } = await supabase
          .from('clients')
          .update(updates)
          .eq('id', id)
          .select();

        if (error) throw error;

        return new Response(JSON.stringify({ client: data[0] }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } else if (operation === 'delete') {
        // Delete a client
        const { id } = requestData;

        if (!id) {
          return new Response(JSON.stringify({ error: 'Client ID is required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }

        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, id }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      }
    }

    // If no matching operation is found
    return new Response(JSON.stringify({ error: 'Invalid operation' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 500,
    });
  }
});
