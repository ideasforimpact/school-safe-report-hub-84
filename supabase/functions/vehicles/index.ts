
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
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    // Get query parameters for filtering
    const clientId = url.searchParams.get('client_id');

    // GET /vehicles - List all vehicles
    if (req.method === 'GET' && path === 'vehicles') {
      let query = supabase.from('vehicles').select('*');
      
      // Add client_id filter if provided
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      return new Response(JSON.stringify({ vehicles: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // GET /vehicles/:id - Get a specific vehicle
    if (req.method === 'GET' && path !== 'vehicles') {
      const vehicleId = path;
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ vehicle: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // POST /vehicles - Create a new vehicle
    if (req.method === 'POST') {
      const vehicleData = await req.json();
      
      // Ensure numeric fields are properly handled
      const processedData = {
        ...vehicleData,
        year: vehicleData.year ? parseInt(vehicleData.year) : null,
        capacity: vehicleData.capacity ? parseInt(vehicleData.capacity) : null
      };
      
      // Remove undefined or empty string values for numeric fields
      if (processedData.capacity === undefined || processedData.capacity === '') {
        processedData.capacity = null;
      }
      
      if (!processedData.year) {
        return new Response(JSON.stringify({ 
          error: "Year is required and must be a valid number" 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert([processedData])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ vehicle: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // PUT /vehicles/:id - Update a vehicle
    if (req.method === 'PUT') {
      const vehicleId = path;
      const updates = await req.json();
      
      // Ensure numeric fields are properly handled
      const processedUpdates = {
        ...updates,
        year: updates.year ? parseInt(updates.year) : undefined,
        capacity: updates.capacity ? parseInt(updates.capacity) : null
      };
      
      // Don't update undefined fields
      if (processedUpdates.year === undefined) {
        delete processedUpdates.year;
      }
      
      if (processedUpdates.capacity === undefined || processedUpdates.capacity === '') {
        processedUpdates.capacity = null;
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .update(processedUpdates)
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ vehicle: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // DELETE /vehicles/:id - Delete a vehicle
    if (req.method === 'DELETE') {
      const vehicleId = path;
      
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If no route matches
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in vehicles function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
