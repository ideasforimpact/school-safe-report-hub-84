
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://ybvxkiubnnixntghojyy.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (req.method !== 'DELETE') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const assessmentId = url.searchParams.get('assessment_id');
    const clientId = url.searchParams.get('client_id');

    if (!assessmentId || !clientId) {
      return new Response(JSON.stringify({ 
        error: 'Assessment ID and Client ID are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('=== ASSESSMENT DELETION ===');
    console.log('Assessment ID:', assessmentId);
    console.log('Client ID:', clientId);

    // First, verify the assessment exists and belongs to the client
    const { data: existingAssessment, error: checkError } = await supabase
      .from('assessments')
      .select('id, assessment_id, name, client_id')
      .eq('id', assessmentId)
      .eq('client_id', clientId)
      .single();

    if (checkError) {
      console.error('Error checking existing assessment:', checkError);
      return new Response(JSON.stringify({ 
        error: 'Assessment not found or access denied' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!existingAssessment) {
      console.log('Assessment not found in database');
      return new Response(JSON.stringify({ 
        error: 'Assessment not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found assessment:', existingAssessment);

    // Delete the assessment
    const { error: deleteError, data: deleteData } = await supabase
      .from('assessments')
      .delete()
      .eq('id', assessmentId)
      .eq('client_id', clientId)
      .select();

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return new Response(JSON.stringify({ 
        error: `Failed to delete assessment: ${deleteError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Assessment deleted successfully:', deleteData);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Assessment deleted successfully',
      deletedAssessment: deleteData[0] 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in delete-assessment function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
