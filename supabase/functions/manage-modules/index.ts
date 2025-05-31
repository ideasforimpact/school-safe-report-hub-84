
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    const { method } = req;
    const url = new URL(req.url);
    const moduleId = url.searchParams.get('id');

    switch (method) {
      case 'POST': {
        const body = await req.json();
        const { name, icon, level, url: moduleUrl } = body;

        //console.log('Creating module:', { name, icon, level, url: moduleUrl });

        const { data, error } = await supabase
          .from('modules')
          .insert({
            name,
            icon,
            level,
            url: moduleUrl
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

        //console.log('Module created successfully:', data);
        return new Response(
          JSON.stringify({ data }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      case 'PUT': {
        if (!moduleId) {
          return new Response(
            JSON.stringify({ error: 'Module ID is required for update' }),
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            }
          );
        }

        const body = await req.json();
        const { name, icon, level, url: moduleUrl } = body;

        //console.log('Updating module:', { id: moduleId, name, icon, level, url: moduleUrl });

        const { data, error } = await supabase
          .from('modules')
          .update({
            name,
            icon,
            level,
            url: moduleUrl,
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

        //console.log('Module updated successfully:', data);
        return new Response(
          JSON.stringify({ data }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      case 'DELETE': {
        if (!moduleId) {
          return new Response(
            JSON.stringify({ error: 'Module ID is required for deletion' }),
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            }
          );
        }

        //console.log('Deleting module:', moduleId);

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

        //console.log('Module deleted successfully');
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
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
