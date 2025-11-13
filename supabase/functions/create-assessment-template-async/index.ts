import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseServiceRoleKey();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { templateData, clientId, employeeId } = await req.json();

    if (!templateData || !clientId || !employeeId) {
      return new Response(
        JSON.stringify({ error: 'templateData, clientId, and employeeId are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Queue the template creation job
    const { data: jobId, error: queueError } = await supabase.rpc('enqueue_assessment_template_creation', {
      job: {
        templateData,
        clientId,
        employeeId,
        createdAt: new Date().toISOString()
      }
    });

    if (queueError) {
      throw queueError;
    }

    // Optionally trigger the consumer immediately
    try {
      await (supabase as any).functions.invoke('async-assessment-file-upload', {
        body: { jobId }
      });
    } catch (invokeError) {
      console.error('Failed to trigger file upload processor:', invokeError);
      // Non-fatal - job is queued and will be processed later
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Template creation queued',
        jobId: jobId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in create-assessment-template-async:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

