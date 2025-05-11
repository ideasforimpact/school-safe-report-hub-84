
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const surepassApiKey = Deno.env.get('SUREPASS_API_KEY') || '';

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

    // Current date and time for verification_date and last_response
    const verificationDate = new Date().toISOString();

    // Call the Surepass API to get RC details - using direct sandbox URL
    const surepassUrl = "https://sandbox.surepass.io/api/v1/rc/rc-full";
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
    
    // Generate verification status based on response
    let verificationStatus = 'verified';
    if (!surepassData.data) {
      verificationStatus = 'failed';
    } else if (surepassData.success === false) {
      verificationStatus = 'incomplete';
    } else if (surepassData.data.rc_status) {
      // Use RC status from response if available
      verificationStatus = surepassData.data.rc_status.toLowerCase();
    }

    // Transform the Surepass data into the required format with history
    // Get existing vehicle data first if we have a vehicleId
    let existingVerificationData = [];
    if (vehicleId) {
      const { data: vehicleData, error } = await supabase
        .from('vehicles')
        .select('verification_data')
        .eq('id', vehicleId)
        .single();

      if (!error && vehicleData && Array.isArray(vehicleData.verification_data)) {
        existingVerificationData = vehicleData.verification_data;
        console.log("Found existing verification data:", existingVerificationData.length, "records");
      }
    }

    // Create new verification data structure
    const transformedData = [];
    
    // Add history record with complete response and timestamp
    transformedData.push({
      field: "verification_log",
      value: {
        last_response: verificationDate,
        original: surepassData,
        status: verificationStatus
      },
      verified: true
    });
    
    // Add each field from the response as a separate object in the array
    if (surepassData.data) {
      const data = surepassData.data;
      
      // Add each field as a separate object in the array
      Object.keys(data).forEach(key => {
        if (data[key] !== null) {
          transformedData.push({
            field: key,
            value: data[key],
            verified: true
          });
        }
      });
    }
    
    // If we have a vehicleId, update the vehicle record with verification data
    if (vehicleId) {
      const { data: updateData, error: updateError } = await supabase
        .from('vehicles')
        .update({
          verification_data: transformedData,
          verification_status: verificationStatus,
          verification_date: verificationDate
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
        data: {
          original: surepassData,
          transformed: transformedData,
          status: verificationStatus,
          verificationDate: verificationDate
        }
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
