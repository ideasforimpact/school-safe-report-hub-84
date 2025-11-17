import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = getSupabaseUrl();
const supabaseServiceKey = getSupabaseServiceRoleKey();

// Integration selector
const integrationName = (Deno.env.get('ENABLE_API_INTEGRATION_NAME') || '').toLowerCase();
const isQuickEKYC = integrationName === 'quickekyc';

// Provider configuration (single prod values as requested)
const providerApiKey = isQuickEKYC
  ? (Deno.env.get('QUICKEKYC_API_KEY_PROD') || '')
  : (Deno.env.get('SUREPASS_PRODUCTION_API_KEY') || Deno.env.get('SUREPASS_API_KEY') || '');

// Base URL without endpoints; endpoints are appended below
const providerBaseUrl = isQuickEKYC
  ? (Deno.env.get('QUICKEKYC_BASE_ENDPOINT') || '')
  : 'https://kyc-api.surepass.io';

// Endpoints (shared rc endpoint, provider-specific challan endpoint)
const rcEndpoint = "/api/v1/rc/rc-full";
const challanEndpoint = isQuickEKYC
  ? "/api/v1/challan/challan"
  : "/api/v1/rc/rc-related/challan-details";

console.log(`Integration selected: ${integrationName || 'default'}`);
console.log(`Base URL: ${providerBaseUrl}`);
console.log(`RC endpoint: ${rcEndpoint}, Challan endpoint: ${challanEndpoint}`);
console.log(`API key present: ${providerApiKey ? 'Yes' : 'No'}`);

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

    // Build RC request
    const rcUrl = `${providerBaseUrl}${rcEndpoint}`;
    console.log(`Making RC API request to: ${rcUrl}`);
    const rcHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (!isQuickEKYC) {
      rcHeaders["Authorization"] = `Bearer ${providerApiKey}`;
    }
    const rcBody = isQuickEKYC
      ? { id_number: registrationNumber, key: providerApiKey }
      : { id_number: registrationNumber };

    const rcResponse = await fetch(rcUrl, {
      method: "POST",
      headers: rcHeaders,
      body: JSON.stringify(rcBody)
    });

    const providerData = await rcResponse.json();
    
    if (!rcResponse.ok) {
      console.error("RC API error:", providerData);
      return new Response(
        JSON.stringify({ 
          error: "Failed to verify vehicle", 
          details: providerData 
        }),
        { 
          status: rcResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Extract required data for challan API call
    let challanData = null;
    if (providerData.data) {
      const data = providerData.data;
      const rcNumber = registrationNumber;
      const chassisNumber = data.vehicle_chasi_number;
      const engineNumber = data.vehicle_engine_number;
      
      console.log(`Got vehicle data - RC: ${rcNumber}, Chassis: ${chassisNumber}, Engine: ${engineNumber}`);
      
      // Check if we have all required parameters for challan call
      if (rcNumber && chassisNumber && engineNumber) {
        try {
          // Build Challan request
          const challanUrl = `${providerBaseUrl}${challanEndpoint}`;
          const challanHeaders: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (!isQuickEKYC) {
            challanHeaders["Authorization"] = `Bearer ${providerApiKey}`;
          }
          const challanBody = isQuickEKYC
            // QuickEKYC challan endpoint expects rc_number and key (no chassis/engine)
            ? { rc_number: rcNumber, key: providerApiKey }
            : { rc_number: rcNumber, chassis_number: chassisNumber, engine_number: engineNumber };

          const challanResponse = await fetch(challanUrl, {
            method: "POST",
            headers: challanHeaders,
            body: JSON.stringify(challanBody)
          });
          
          challanData = await challanResponse.json();
          const challanOk = isQuickEKYC
            ? challanData?.status_code === 200
            : challanData?.success !== false;
          console.log("Challan API response received:", challanOk ? "Success" : "Failed", challanData);
          
          // Add challan data to the registration data
          if (providerData.data) {
            providerData.data.challan_details = challanData.data || null;
          }
        } catch (challanError) {
          console.error("Error fetching challan details:", challanError);
          // Continue even if challan request fails
        }
      } else {
        console.log("Missing required parameters for challan lookup:", {
          rcNumber: !!rcNumber,
          chassisNumber: !!chassisNumber,
          engineNumber: !!engineNumber
        });
      }
    } else {
      console.log("No vehicle data available from verification response for challan lookup");
    }
    
    // Generate verification status based on response
    let verificationStatus = 'verified';
    if (!providerData.data) {
      verificationStatus = 'failed';
    } else if (providerData.success === false) {
      verificationStatus = 'incomplete';
    } else if (providerData.data.rc_status) {
      // Use RC status from response if available
      verificationStatus = providerData.data.rc_status.toLowerCase();
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
    if (providerData.data) {
      const data = providerData.data;
      console.log(data,"Debugging the RC response data");
      
      // After successful verification, update the vehicles table fields based on registration_number
      try {
        // Only proceed when we have a valid registration number and data
        const registrationNum = registrationNumber;
        if (registrationNum) {
          // Derive fields from verification response
          const makerModel = data.maker_model || null;
          const ownerName = data.owner_name || null;
          const seatCapacityRaw = data.seat_capacity;
          const seatCapacity = typeof seatCapacityRaw === 'number' ? seatCapacityRaw : (seatCapacityRaw ? parseInt(String(seatCapacityRaw)) : null);
          const registrationDateStr = data.registration_date || null; // e.g., 2007-08-16
          const registrationYear = registrationDateStr ? new Date(registrationDateStr).getFullYear() : null;

          // Directly update by registration_number to avoid extra queries
          const updates: Record<string, any> = {
            type: 'bus',
            model: makerModel,
            driver: ownerName,
            route: null,
            capacity: seatCapacity,
          };
          if (registrationYear && !Number.isNaN(registrationYear)) {
            updates.year = registrationYear;
          }

          const { error: vehicleUpdateError } = await supabase
            .from('vehicles')
            .update(updates)
            .eq('registration_number', registrationNum);

          if (vehicleUpdateError) {
            console.error('Error updating vehicle core fields after verification:', vehicleUpdateError);
          } else {
            console.log('Vehicle fields updated after verification for', registrationNum);
          }

          // Add helper display values to the verification data for the UI
          if (makerModel) {
            currentVerificationData.push({
              field: 'display_type',
              value: makerModel,
              verified: true
            });
          }
          if (registrationYear) {
            currentVerificationData.push({
              field: 'display_year',
              value: registrationYear,
              verified: true
            });
          }
        }
      } catch (postUpdateErr) {
        console.error('Post-verification vehicle update error:', postUpdateErr);
      }
      
      // Add each field as a separate object in the array
      Object.keys(data).forEach(key => {
        if (data[key] !== null && key !== 'challan_details') {
          currentVerificationData.push({
            field: key,
            value: data[key],
            verified: true
          });
        }
      });
    }
    
    // Add challan data as a specific field if available, with simplified structure
    if (challanData && challanData.data) {
      // Process challan data to keep only essential information
      const processedChallanData = isQuickEKYC
        ? {
          challan_details: {
            // QuickEKYC returns an array at data.challan_data (may be empty)
            challans: Array.isArray(challanData.data.challan_data)
              ? challanData.data.challan_data
              : [],
            successful_backends: []
          }
        }
        : {
          challan_details: {
            challans: challanData.data.challan_details?.challans?.map((challan: any) => ({
              challan_number: challan.challan_number,
              challan_status: challan.challan_status,
              amount: challan.amount,
              challan_date: challan.challan_date
            })) || [],
            successful_backends: challanData.data.challan_details?.successful_backends || []
          }
        };
      
      // Add to verification data only once
      currentVerificationData.push({
        field: 'challan_details',
        value: processedChallanData,
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
    const completeTransformedData = [verificationLogEntry];
    
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
          original: providerData,
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
