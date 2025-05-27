
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

    const { form_id, responses, submitter_name, submitter_email, comments } = await req.json();
    
    if (!form_id) {
      return new Response(
        JSON.stringify({ 
          error: 'form_id is required',
          code: 'MISSING_FORM_ID'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!responses || !Array.isArray(responses)) {
      return new Response(
        JSON.stringify({ 
          error: 'responses array is required',
          code: 'MISSING_RESPONSES'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Submitting form: ${form_id}`);
    console.log('Responses:', JSON.stringify(responses, null, 2));

    // Verify the form exists and is active
    const { data: form, error: formError } = await supabaseClient
      .from('custom_forms')
      .select('id, title, is_active')
      .eq('id', form_id)
      .single();

    if (formError || !form) {
      console.error('Form not found:', formError);
      return new Response(
        JSON.stringify({ 
          error: 'Form not found',
          code: 'FORM_NOT_FOUND'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!form.is_active) {
      return new Response(
        JSON.stringify({ 
          error: 'Form is not active',
          code: 'FORM_INACTIVE'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Insert the form submission
    const { data: submission, error: submissionError } = await supabaseClient
      .from('form_submissions')
      .insert({
        form_id: form_id,
        submitter_name: submitter_name || null,
        submitter_email: submitter_email || null,
        responses: responses,
        comments: comments || null,
        status: 'new'
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      return new Response(
        JSON.stringify({ 
          error: `Failed to create submission: ${submissionError.message}`,
          code: 'SUBMISSION_FAILED'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Form submission created successfully:', submission.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: submission,
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
