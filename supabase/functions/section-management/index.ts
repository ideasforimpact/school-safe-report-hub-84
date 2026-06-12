import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

  try {
    const { action, id, name, gradeId, campusId, clientId, clientTypeId } = await req.json();

    if (!clientId) throw new Error("Client ID is required for all operations");

    switch (action) {
      case 'list': {
        let query = supabaseClient.from('sections').select('*').eq('client_id', clientId);
        if (clientTypeId) query = query.eq('client_type_id', clientTypeId);

        const { data, error } = await query;
        if (error) throw error;
        return new Response(
          JSON.stringify({ sections: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        const { data, error } = await supabaseClient
          .from('sections')
          .insert({ name, grade_id: gradeId, campus_id: campusId, client_id: clientId, client_type_id: clientTypeId || null })
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ section: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        const { data: existing, error: verifyError } = await supabaseClient
          .from('sections').select('id').eq('id', id).eq('client_id', clientId).single();

        if (verifyError || !existing) {
          return new Response(
            JSON.stringify({ error: 'Section not found or access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        const { data, error } = await supabaseClient
          .from('sections')
          .update({ name, grade_id: gradeId, campus_id: campusId })
          .eq('id', id).eq('client_id', clientId).select().single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ section: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        const { data: existing, error: verifyError } = await supabaseClient
          .from('sections').select('id').eq('id', id).eq('client_id', clientId).single();

        if (verifyError || !existing) {
          return new Response(
            JSON.stringify({ error: 'Section not found or access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        const { error } = await supabaseClient
          .from('sections').delete().eq('id', id).eq('client_id', clientId);

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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
