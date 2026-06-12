import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { action, name, id, campusId, clientId, clientTypeId } = await req.json();

    switch (action) {
      case 'list': {
        let query = supabaseClient.from('grades').select('*').eq('client_id', clientId);
        if (clientTypeId) query = query.eq('client_type_id', clientTypeId);

        const { data, error } = await query;
        if (error) throw error;
        return new Response(
          JSON.stringify({ grades: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        const { data, error } = await supabaseClient
          .from('grades')
          .insert({ name, client_id: clientId, campus_id: campusId, client_type_id: clientTypeId || null })
          .select('*')
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ grade: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        const { data, error } = await supabaseClient
          .from('grades')
          .update({ name, campus_id: campusId })
          .eq('id', id)
          .select('*')
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ grade: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        const { error } = await supabaseClient.from('grades').delete().eq('id', id);
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
