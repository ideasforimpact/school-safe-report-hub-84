
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create a Supabase client with the Admin key
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { action, id, name, gradeId, campusId, clientId } = await req.json();
    console.log(`Section management: Action=${action}, ID=${id}, Name=${name}, GradeID=${gradeId}, CampusID=${campusId}, ClientID=${clientId}`);

    if (!clientId) {
      throw new Error("Client ID is required for all operations");
    }

    switch (action) {
      case 'list': {
        const { data, error } = await supabaseClient
          .from('sections')
          .select('*')
          .eq('client_id', clientId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ sections: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        // Include campus_id in the insert operation
        const { data, error } = await supabaseClient
          .from('sections')
          .insert({
            name,
            grade_id: gradeId,
            campus_id: campusId,
            client_id: clientId
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ section: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        // Verify ownership before update
        const { data: existingSection, error: verifyError } = await supabaseClient
          .from('sections')
          .select('id')
          .eq('id', id)
          .eq('client_id', clientId)
          .single();
          
        if (verifyError || !existingSection) {
          return new Response(
            JSON.stringify({ error: 'Section not found or access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        // Include campus_id in the update operation
        const { data, error } = await supabaseClient
          .from('sections')
          .update({
            name,
            grade_id: gradeId,
            campus_id: campusId
          })
          .eq('id', id)
          .eq('client_id', clientId)
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ section: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        // Verify ownership before delete
        const { data: existingSection, error: verifyError } = await supabaseClient
          .from('sections')
          .select('id')
          .eq('id', id)
          .eq('client_id', clientId)
          .single();
          
        if (verifyError || !existingSection) {
          return new Response(
            JSON.stringify({ error: 'Section not found or access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        const { error } = await supabaseClient
          .from('sections')
          .delete()
          .eq('id', id)
          .eq('client_id', clientId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error(`Error in section-management function: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
