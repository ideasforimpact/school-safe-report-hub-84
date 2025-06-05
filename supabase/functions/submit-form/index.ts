
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { form_id, submitter_name, submitter_email, responses } = await req.json();
    
    if (!form_id || !responses) {
      return new Response(
        JSON.stringify({ 
          error: 'form_id and responses are required',
          code: 'MISSING_REQUIRED_FIELDS'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Submitting form: ${form_id}`);

    // Insert the form submission with 'new' status
    const { data, error } = await supabaseClient
      .from('form_submissions')
      .insert([{
        form_id,
        submitter_name,
        submitter_email,
        responses,
        status: 'new', // Always start with 'new' status
        comments: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error submitting form:', error);
      throw new Error(`Failed to submit form: ${error.message}`);
    }

    console.log('Form submitted successfully:', data.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data,
        message: 'Form submitted successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in submit-form function:', error);
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
