import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import { validateIPWhitelist } from '../_shared/safe-school/ipValidator.ts';

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
    getSupabaseUrl(),
    getSupabaseServiceRoleKey()
  );

  try {
    const body = await req.json();
    const { action, clientId, vehicles, vehicle, vehicle_id, employee_id } = body;
    
    console.log(`Trusted vehicle management: Action=${action}, ClientID=${clientId}`);

    if (!clientId) {
      throw new Error("Client ID is required for all operations");
    }

    // Validate IP whitelist
    const url = new URL(req.url);
    const ipValidation = await validateIPWhitelist(
      supabaseClient,
      req,
      clientId,
      url.pathname
    );
    
    if (!ipValidation.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'IP_NOT_WHITELISTED',
          message: 'Access denied. Your IP address is not whitelisted for this client.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'create_bulk': {
        if (!Array.isArray(vehicles) || vehicles.length === 0) {
          throw new Error('Vehicles array is required and must not be empty');
        }

        // Validate each vehicle
        for (const v of vehicles) {
          if (!v.vehicle_name?.trim()) {
            throw new Error('Vehicle name is required for all vehicles');
          }
          if (!v.type?.trim()) {
            throw new Error('Vehicle type is required for all vehicles');
          }
          if (!v.vehicle_no?.trim()) {
            throw new Error('Vehicle number is required for all vehicles');
          }
          if (!v.name?.trim()) {
            throw new Error('Name is required for all vehicles');
          }
          if (!v.validity_from) {
            throw new Error('Validity from date is required for all vehicles');
          }
          if (!v.validity_to) {
            throw new Error('Validity to date is required for all vehicles');
          }
        }

        // Prepare vehicles data for insertion
        const vehiclesToInsert = vehicles.map((v) => ({
          vehicle_name: v.vehicle_name.trim(),
          type: v.type.trim(),
          vehicle_no: v.vehicle_no.trim(),
          client_id: clientId,
          employee_id: employee_id || null,
          name: v.name.trim(),
          validity_from: v.validity_from,
          validity_to: v.validity_to,
          comments: v.comments?.trim() || null,
        }));

        console.log('Creating trusted vehicles:', { 
          count: vehiclesToInsert.length, 
          client_id: clientId,
          employee_id: employee_id 
        });

        const { data, error } = await supabaseClient
          .from('trusted_vehicle')
          .insert(vehiclesToInsert)
          .select();

        if (error) {
          console.error('Error inserting trusted vehicles:', error);
          throw error;
        }

        console.log('Successfully created trusted vehicles:', data.length);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Successfully created ${data.length} trusted vehicle(s)`,
            data,
            count: data.length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        if (!vehicle?.id) {
          throw new Error('Vehicle id is required for update');
        }

        if (!vehicle.vehicle_name?.trim()) {
          throw new Error('Vehicle name is required');
        }
        if (!vehicle.type?.trim()) {
          throw new Error('Vehicle type is required');
        }
        if (!vehicle.vehicle_no?.trim()) {
          throw new Error('Vehicle number is required');
        }
        if (!vehicle.name?.trim()) {
          throw new Error('Name is required');
        }

        // Verify ownership before update
        const { data: existingVehicle, error: verifyError } = await supabaseClient
          .from('trusted_vehicle')
          .select('id')
          .eq('id', vehicle.id)
          .eq('client_id', clientId)
          .single();
          
        if (verifyError || !existingVehicle) {
          return new Response(
            JSON.stringify({ error: 'Trusted vehicle not found or access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        const updatePayload: Record<string, any> = {
          vehicle_name: vehicle.vehicle_name.trim(),
          type: vehicle.type.trim(),
          vehicle_no: vehicle.vehicle_no.trim(),
          name: vehicle.name.trim(),
          comments: vehicle.comments?.trim() || null,
        };

        if (vehicle.validity_from) {
          updatePayload.validity_from = vehicle.validity_from;
        }
        if (vehicle.validity_to) {
          updatePayload.validity_to = vehicle.validity_to;
        }

        console.log('Updating trusted vehicle:', { id: vehicle.id, client_id: clientId });

        const { data, error } = await supabaseClient
          .from('trusted_vehicle')
          .update(updatePayload)
          .eq('id', vehicle.id)
          .eq('client_id', clientId)
          .select()
          .single();

        if (error) {
          console.error('Error updating trusted vehicle:', error);
          throw error;
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Trusted vehicle updated successfully',
            data,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!vehicle_id) {
          throw new Error('vehicle_id is required for delete');
        }

        // Verify ownership before delete
        const { data: existingVehicle, error: verifyError } = await supabaseClient
          .from('trusted_vehicle')
          .select('id')
          .eq('id', vehicle_id)
          .eq('client_id', clientId)
          .single();
          
        if (verifyError || !existingVehicle) {
          return new Response(
            JSON.stringify({ error: 'Trusted vehicle not found or access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        console.log('Deleting trusted vehicle:', { id: vehicle_id, client_id: clientId });

        const { error } = await supabaseClient
          .from('trusted_vehicle')
          .delete()
          .eq('id', vehicle_id)
          .eq('client_id', clientId);

        if (error) {
          console.error('Error deleting trusted vehicle:', error);
          throw error;
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Trusted vehicle deleted successfully',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error(`Error in trusted-vehicle-management function: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

