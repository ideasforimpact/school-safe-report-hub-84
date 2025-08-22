
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

    const { form_id, client_id } = await req.json();

    if (!form_id && !client_id) {
      return new Response(
        JSON.stringify({ 
          error: 'form_id or client_id is required',
          code: 'MISSING_FILTER'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let query = supabaseClient
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false }) as any;

    if (form_id) {
      console.log(`Fetching submissions for form: ${form_id}`);
      query = query.eq('form_id', form_id);
    } else if (client_id) {
      console.log(`Fetching submissions for client: ${client_id}`);
      query = query.eq('client_id', client_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      throw new Error(`Failed to fetch submissions: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data || [],
        message: 'Submissions fetched successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in fetch-form-submissions function:', error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
