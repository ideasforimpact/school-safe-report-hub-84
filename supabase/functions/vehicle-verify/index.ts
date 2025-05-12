
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Get environment configuration
const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';

// Choose the appropriate API key based on environment
const surepassApiKey = isDevelopment 
  ? Deno.env.get('SUREPASS_SANDBOX_API_KEY') || Deno.env.get('SUREPASS_API_KEY') || ''
  : Deno.env.get('SUREPASS_PRODUCTION_API_KEY') || Deno.env.get('SUREPASS_API_KEY') || '';

// Choose the appropriate API base URLs based on environment
const surepassBaseUrl = isDevelopment 
  ? "https://sandbox.surepass.io/api/v1/rc/rc-full"
  : "https://kyc-api.surepass.io/api/v1/rc/rc-full";

const surepassChallanUrl = isDevelopment
  ? "https://sandbox.surepass.io/api/v1/rc/rc-related/challan-details"
  : "https://kyc-api.surepass.io/api/v1/rc/rc-related/challan-details";

console.log(`Using Surepass API URL: ${surepassBaseUrl} (Development mode: ${isDevelopment})`);
console.log(`Using Surepass Challan URL: ${surepassChallanUrl}`);
console.log(`Using environment-specific API key: ${surepassApiKey ? 'Yes (key present)' : 'No (key missing)'}`);

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

    // Call the Surepass API to get RC details
    console.log(`Making API request to: ${surepassBaseUrl}`);
    const surepassResponse = await fetch(surepassBaseUrl, {
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
    
    // Extract client_id from the response for challan API call
    let challanData = null;
    if (surepassData.data && surepassData.data.client_id) {
      const clientId = surepassData.data.client_id;
      console.log(`Got client_id: ${clientId}, making challan details request`);
      
      try {
        // Make the second API call to get challan details
        const challanResponse = await fetch(surepassChallanUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${surepassApiKey}`
          },
          body: JSON.stringify({
            client_id: clientId
          })
        });
        
        challanData = await challanResponse.json();
        console.log("Challan API response received:", challanData.success ? "Success" : "Failed");
        
        // Add challan data to the registration data
        if (surepassData.data) {
          surepassData.data.challan_details = challanData.data || null;
        }
      } catch (challanError) {
        console.error("Error fetching challan details:", challanError);
        // Continue even if challan request fails
      }
    } else {
      console.log("No client_id available from verification response for challan lookup");
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
    let existingVerificationLog = {};
    
    if (vehicleId) {
      const { data: vehicleData, error } = await supabase
        .from('vehicles')
        .select('verification_data')
        .eq('id', vehicleId)
        .single();

      if (!error && vehicleData && Array.isArray(vehicleData.verification_data)) {
        // Find the verification_log entry
        const logEntry = vehicleData.verification_data.find(item => item.field === 'verification_log');
        if (logEntry && logEntry.value) {
          existingVerificationLog = logEntry.value;
        }
        
        console.log("Found existing verification data with log entry");
      }
    }
    
    // Create verification data from the response fields
    const currentVerificationData = [];
    
    // Add last_response field to track when we got this response
    currentVerificationData.push({
      field: 'last_response',
      value: verificationDate,
      verified: true
    });
    
    // Add status field from the API response
    currentVerificationData.push({
      field: 'status',
      value: verificationStatus,
      verified: true
    });
    
    // Create verification data from the response fields
    if (surepassData.data) {
      const data = surepassData.data;
      
      // Add each field as a separate object in the array
      Object.keys(data).forEach(key => {
        if (data[key] !== null) {
          currentVerificationData.push({
            field: key,
            value: data[key],
            verified: true
          });
        }
      });
    }
    
    // Add challan data as a specific field if available
    if (challanData && challanData.data) {
      currentVerificationData.push({
        field: 'challan_details',
        value: challanData.data,
        verified: true
      });
    }
    
    // Store the current verification data in the log with timestamp as key
    const updatedVerificationLog = {
      ...existingVerificationLog,
      [verificationDate]: currentVerificationData
    };
    
    // Create the verification log entry in the correct format
    const verificationLogEntry = {
      field: "verification_log",
      value: updatedVerificationLog,
      verified: true
    };
    
    // The complete transformed data array should have the verification log as the first item
    // and also include challan details directly in the transformed data
    const completeTransformedData = [verificationLogEntry];
    
    // Add challan_details directly in the transformed data if available
    if (challanData && challanData.data) {
      completeTransformedData.push({
        field: "challan_details",
        value: challanData.data,
        verified: true
      });
    }
    
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
          challan: challanData,
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
