import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key to bypass RLS policies for module management
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { method } = req;
    const url = new URL(req.url);
    const moduleIdFromUrl = url.searchParams.get('id');
    const body = await req.json();
    const moduleIdFromBody = body.id;
    const moduleId = moduleIdFromUrl || moduleIdFromBody;

    // Determine operation: if moduleId exists, it's an update; otherwise it's a create
    // Note: Edge functions invoked via supabase.functions.invoke() always use POST
    const isUpdate = !!moduleId || method === 'PUT';

    if (method === 'DELETE') {
      // Handle DELETE
      if (!moduleId) {
        return new Response(
          JSON.stringify({ error: 'Module ID is required for deletion' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      console.log('Deleting module:', moduleId);

      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) {
        console.error('Error deleting module:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      console.log('Module deleted successfully');
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } else if (isUpdate) {
      // Handle UPDATE
      if (!moduleId) {
        return new Response(
          JSON.stringify({ error: 'Module ID is required for update' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      const { name, icon, level, url: moduleUrl, active } = body;

      console.log('Updating module:', { id: moduleId, name, icon, level, url: moduleUrl, active });

      const { data, error } = await supabase
        .from('modules')
        .update({
          name,
          icon,
          level,
          url: moduleUrl,
          active,
          updated_at: new Date().toISOString()
        })
        .eq('id', moduleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating module:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      console.log('Module updated successfully:', data);
      return new Response(
        JSON.stringify({ data }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } else {
      // Handle CREATE
      const { name, icon, level, url: moduleUrl, active = true } = body;

      console.log('Creating module:', { name, icon, level, url: moduleUrl, active });

      const { data, error } = await supabase
        .from('modules')
        .insert({
          name,
          icon,
          level,
          url: moduleUrl,
          active
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating module:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      console.log('Module created successfully:', data);
      return new Response(
        JSON.stringify({ data }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

  } catch (error) {
    console.error('Error in manage-modules function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
