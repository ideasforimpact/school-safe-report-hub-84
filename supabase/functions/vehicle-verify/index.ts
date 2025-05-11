
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const surepassApiKey = Deno.env.get('SUREPASS_API_KEY') || '';
const surepassBaseUrl = Deno.env.get('SUREPASS_BASE_URL') || 'https://sandbox.surepass.io';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse the request body
    const { registrationNumber, vehicleId } = await req.json();
    
    if (!registrationNumber) {
      return new Response(
        JSON.stringify({ error: "Registration number is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verifying vehicle with registration number: ${registrationNumber}`);
    console.log(`Using Surepass base URL: ${surepassBaseUrl}`);

    // Call the Surepass API to get RC details
    const surepassUrl = `${surepassBaseUrl}/api/v1/rc/rc-full`;
    const surepassResponse = await fetch(surepassUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${surepassApiKey}`
      },
      body: JSON.stringify({
        id_number: registrationNumber
      })
    });

    const surepassData = await surepassResponse.json();
    
    if (!surepassResponse.ok) {
      console.error("Surepass API error:", surepassData);
      return new Response(
        JSON.stringify({ 
          error: "Failed to verify vehicle", 
          details: surepassData 
        }),
        { 
          status: surepassResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If we have a vehicleId, update the vehicle record with verification data
    if (vehicleId) {
      const { data: updateData, error: updateError } = await supabase
        .from('vehicles')
        .update({
          verification_data: surepassData,
          verification_status: 'verified',
          verification_date: new Date().toISOString()
        })
        .eq('id', vehicleId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating vehicle verification data:", updateError);
      } else {
        console.log("Vehicle verification data updated successfully");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: surepassData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in vehicle-verify function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred during verification" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
