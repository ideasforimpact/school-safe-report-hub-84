
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
    const timestampKey = verificationDate.replace(/[:.]/g, '-');

    // Call the Surepass API to get RC details
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

    // Get existing vehicle data first if we have a vehicleId
    let existingVerificationData = [];
    let verificationLog = {};
    
    if (vehicleId) {
      const { data: vehicleData, error } = await supabase
        .from('vehicles')
        .select('verification_data')
        .eq('id', vehicleId)
        .single();

      if (!error && vehicleData && Array.isArray(vehicleData.verification_data)) {
        existingVerificationData = vehicleData.verification_data;
        
        // Find the existing verification log if it exists
        const logEntry = existingVerificationData.find(item => item.field === 'verification_log');
        if (logEntry && logEntry.value) {
          verificationLog = logEntry.value;
        }
        
        console.log("Found existing verification data:", existingVerificationData.length, "records");
      }
    }
    
    // Transform the Surepass data into the required format
    const transformedData = [];
    
    // Create verification data from the response fields, excluding verification_log
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
      
      // Add last_response field to track when we got this response
      transformedData.push({
        field: 'last_response',
        value: verificationDate,
        verified: true
      });
      
      // Add status field from the API response
      transformedData.push({
        field: 'status',
        value: verificationStatus,
        verified: true
      });
    }
    
    // Store the current verification data in the log
    // Create a timestamp-based key for the verification log
    verificationLog[verificationDate] = transformedData;
    
    // Create the complete transformed data by adding the verification log at the beginning
    const completeTransformedData = [
      {
        field: "verification_log",
        value: verificationLog,
        verified: true
      },
      ...transformedData
    ];
    
    // If we have a vehicleId, update the vehicle record with verification data
    if (vehicleId) {
      const { data: updateData, error: updateError } = await supabase
        .from('vehicles')
        .update({
          verification_data: completeTransformedData,
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
          transformed: completeTransformedData,
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
