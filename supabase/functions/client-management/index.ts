
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');

    if (req.method === 'GET' && clientId) {
      console.log(`Fetching client details for clientId: ${clientId}`);
      
      // Fetch client details
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error('Error fetching client:', clientError);
        throw new Error(`Failed to fetch client: ${clientError.message}`);
      }

      // Fetch client modules with COMPLETE module details including url and order
      const { data: clientModules, error: modulesError } = await supabase
        .from('client_modules')
        .select(`
          *,
          modules (
            id,
            name,
            icon,
            level,
            url,
            order
          )
        `)
        .eq('client_id', clientId)
        .order('modules(order)', { ascending: true, nullsFirst: false });

      if (modulesError) {
        console.error('Error fetching client modules:', modulesError);
        // Don't throw error, just return empty array
      }

      console.log(`Found ${clientModules?.length || 0} client modules with complete data:`, 
        clientModules?.map(cm => ({
          moduleName: cm.modules?.name,
          url: cm.modules?.url,
          order: cm.modules?.order,
          enabled: cm.enabled
        }))
      );

      // Fetch all available modules with url and order for selection
      const { data: allModules, error: allModulesError } = await supabase
        .from('modules')
        .select('id, name, icon, level, url, order')
        .order('order', { ascending: true, nullsFirst: false });

      if (allModulesError) {
        console.error('Error fetching all modules:', allModulesError);
      }

      console.log(`Found ${allModules?.length || 0} available modules with url and order`);

      return new Response(
        JSON.stringify({
          client,
          modules: clientModules || [],
          availableModules: allModules || []
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (req.method === 'POST' && clientId) {
      const { moduleId, enabled, access_level } = await req.json();

      console.log(`Updating module access for client ${clientId}, module ${moduleId}, enabled: ${enabled}`);

      // Check if the module already exists for the client
      const { data: existingModule, error: existingModuleError } = await supabase
        .from('client_modules')
        .select('*')
        .eq('client_id', clientId)
        .eq('module_id', moduleId)
        .single();

      if (existingModuleError && existingModuleError.code !== 'PGRST116') {
        console.error('Error checking existing module:', existingModuleError);
        throw new Error(`Failed to check existing module: ${existingModuleError.message}`);
      }

      if (existingModule) {
        // Update existing module
        const { error: updateError } = await supabase
          .from('client_modules')
          .update({ enabled, access_level })
          .eq('client_id', clientId)
          .eq('module_id', moduleId);

        if (updateError) {
          console.error('Error updating module:', updateError);
          throw new Error(`Failed to update module: ${updateError.message}`);
        }
        console.log('Successfully updated existing module');
      } else {
        // Insert new module
        const { error: insertError } = await supabase
          .from('client_modules')
          .insert([{ client_id: clientId, module_id: moduleId, enabled, access_level }]);

        if (insertError) {
          console.error('Error inserting module:', insertError);
          throw new Error(`Failed to insert module: ${insertError.message}`);
        }
        console.log('Successfully inserted new module');
      }

      return new Response(
        JSON.stringify({ message: 'Module access updated successfully' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (req.method === 'PUT' && clientId) {
      const { name, email, contact_person, phone, logo, institution_type, allowed_domains, auth_providers, super_admin_allowed_domain, active } = await req.json();

      console.log(`Updating client ${clientId} with new data`);

      const { error: updateError } = await supabase
        .from('clients')
        .update({ name, email, contact_person, phone, logo, institution_type, allowed_domains, auth_providers, super_admin_allowed_domain, active })
        .eq('id', clientId);

      if (updateError) {
        console.error('Error updating client:', updateError);
        throw new Error(`Failed to update client: ${updateError.message}`);
      }

      console.log('Successfully updated client');

      return new Response(
        JSON.stringify({ message: 'Client updated successfully' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in client-management function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
