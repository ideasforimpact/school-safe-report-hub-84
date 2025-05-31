
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

    const { submission_id, comments, status } = await req.json();
    
    if (!submission_id) {
      return new Response(
        JSON.stringify({ 
          error: 'submission_id is required',
          code: 'MISSING_SUBMISSION_ID'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    //console.log(`Updating submission: ${submission_id}`);

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (comments !== undefined) {
      updateData.comments = comments;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const { data, error } = await supabaseClient
      .from('form_submissions')
      .update(updateData)
      .eq('id', submission_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating submission:', error);
      throw new Error(`Failed to update submission: ${error.message}`);
    }

    //console.log('Form submission updated successfully:', submission_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data,
        message: 'Submission updated successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in update-form-submission function:', error);
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
