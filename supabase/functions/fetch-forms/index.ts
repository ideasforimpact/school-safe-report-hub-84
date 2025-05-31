
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { client_id } = await req.json();
    
    if (!client_id) {
      return new Response(
        JSON.stringify({ 
          error: 'client_id is required',
          code: 'MISSING_CLIENT_ID'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    //console.log(`Fetching forms for client: ${client_id}`);

    const { data, error } = await supabaseClient
      .from('custom_forms')
      .select('*')
      .eq('client_id', client_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching forms:', error);
      throw new Error(`Failed to fetch forms: ${error.message}`);
    }

    // Transform database data to ensure fields is an array
    const transformedForms = (data || []).map(form => ({
      ...form,
      fields: Array.isArray(form.fields) ? form.fields : []
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: transformedForms,
        message: 'Forms fetched successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in fetch-forms function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
