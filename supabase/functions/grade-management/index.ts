
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { action, name, id, campusId, clientId } = await req.json();
    console.log(`Grade management: Action=${action}, ID=${id}, Name=${name}, CampusID=${campusId}, ClientID=${clientId}`);

    switch (action) {
      case 'create':
        const createResult = await supabaseClient
          .from('grades')
          .insert({
            name,
            client_id: clientId,
            campus_id: campusId,
          })
          .select('*')
          .single();

        if (createResult.error) throw createResult.error;
        return new Response(
          JSON.stringify({ grade: createResult.data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'update':
        const updateResult = await supabaseClient
          .from('grades')
          .update({ name, campus_id: campusId })
          .eq('id', id)
          .select('*')
          .single();

        if (updateResult.error) throw updateResult.error;
        return new Response(
          JSON.stringify({ grade: updateResult.data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'delete':
        const deleteResult = await supabaseClient
          .from('grades')
          .delete()
          .eq('id', id);

        if (deleteResult.error) throw deleteResult.error;
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'list':
        const listResult = await supabaseClient
          .from('grades')
          .select('*')
          .eq('client_id', clientId);

        if (listResult.error) throw listResult.error;
        return new Response(
          JSON.stringify({ grades: listResult.data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error("Grade management error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
