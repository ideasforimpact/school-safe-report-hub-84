// Follow Deno runtime API
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

    let body: any = {};
    if (req.method !== 'GET') {
      body = await req.json();
    }

    const action = req.method === 'GET'
      ? new URL(req.url).searchParams.get('action') || 'list'
      : body.action || '';

    switch (action) {
      case 'list': {
        const clientId = req.method === 'GET'
          ? new URL(req.url).searchParams.get('clientId')
          : body.clientId;
        const clientTypeId = req.method === 'GET'
          ? new URL(req.url).searchParams.get('clientTypeId')
          : body.clientTypeId;

        if (!clientId) {
          return new Response(
            JSON.stringify({ error: 'Client ID is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        let query = supabase.from('campuses').select('*').eq('client_id', clientId);
        if (clientTypeId) query = query.eq('client_type_id', clientTypeId);

        const { data: campuses, error } = await query;
        if (error) throw error;

        return new Response(
          JSON.stringify({ campuses }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
        
      case 'create': {
        const { name, clientId, clientTypeId } = body;

        if (!name || !clientId) {
          return new Response(
            JSON.stringify({ error: 'Name and Client ID are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const { data: campus, error } = await supabase
          .from('campuses')
          .insert({ name, client_id: clientId, client_type_id: clientTypeId || null })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ campus }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
        
      case 'update': {
        const { id, name, clientId } = body;
        
        if (!id || !name || !clientId) {
          return new Response(
            JSON.stringify({ error: 'ID, name, and Client ID are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const { data: existing, error: checkError } = await supabase
          .from('campuses').select('id').eq('id', id).eq('client_id', clientId).single();
        if (checkError || !existing) {
          return new Response(
            JSON.stringify({ error: 'Campus not found or access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }
        
        const { data: campus, error } = await supabase
          .from('campuses').update({ name }).eq('id', id).eq('client_id', clientId).select().single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ campus }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
        
      case 'delete': {
        const { id, clientId } = body;
        
        if (!id || !clientId) {
          return new Response(
            JSON.stringify({ error: 'ID and Client ID are required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const { data: existing, error: checkError } = await supabase
          .from('campuses').select('id').eq('id', id).eq('client_id', clientId).single();

        if (checkError || !existing) {
          return new Response(
            JSON.stringify({ error: 'Campus not found or access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }
        
        const { error } = await supabase
          .from('campuses').delete().eq('id', id).eq('client_id', clientId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
