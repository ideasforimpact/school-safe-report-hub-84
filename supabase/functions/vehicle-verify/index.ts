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

// ============================================================================
// QuickEKYC Functions
// ============================================================================

/**
 * Get QuickEKYC configuration
 */
function getQuickEKYCConfig() {
  return {
    apiKey: Deno.env.get('QUICKEKYC_API_KEY_PROD') || '',
    baseUrl: Deno.env.get('QUICKEKYC_BASE_ENDPOINT') || '',
    rcEndpoint: "/api/v1/rc/rc-full",
    challanEndpoint: "/api/v1/challan/challan"
  };
}

/**
 * Prepare QuickEKYC RC API payload
 */
function prepareQuickEKYCRCPayload(registrationNumber: string, apiKey: string) {
  return {
    id_number: registrationNumber,
    key: apiKey
  };
}

/**
 * Prepare QuickEKYC RC API headers
 */
function prepareQuickEKYCRCHeaders() {
  return {
    "Content-Type": "application/json"
  };
}

/**
 * Call QuickEKYC RC API
 */
async function callQuickEKYCRCAPI(registrationNumber: string) {
  const config = getQuickEKYCConfig();
  const url = `${config.baseUrl}${config.rcEndpoint}`;
  const headers = prepareQuickEKYCRCHeaders();
  const body = prepareQuickEKYCRCPayload(registrationNumber, config.apiKey);
  
  console.log(`[QuickEKYC] Making RC API request to: ${url}`);
  
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  
  return response;
}

/**
 * Prepare QuickEKYC Challan API payload
 */
function prepareQuickEKYCChallanPayload(rcNumber: string, apiKey: string) {
  return {
    id_number: rcNumber,
    key: apiKey
  };
}

/**
 * Prepare QuickEKYC Challan API headers
 */
function prepareQuickEKYCChallanHeaders() {
  return {
    "Content-Type": "application/json"
  };
}

/**
 * Call QuickEKYC Challan API
 */
async function callQuickEKYCChallanAPI(rcNumber: string) {
  const config = getQuickEKYCConfig();
  const url = `${config.baseUrl}${config.challanEndpoint}`;
  const headers = prepareQuickEKYCChallanHeaders();
  const body = prepareQuickEKYCChallanPayload(rcNumber, config.apiKey);
  
  console.log(`[QuickEKYC] Making Challan API request to: ${url}`);
  
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  
  return response;
}

/**
 * Validate QuickEKYC Challan response
 */
function validateQuickEKYCChallanResponse(challanData: any): boolean {
  return challanData?.status_code === 200;
}

/**
 * Process QuickEKYC Challan data
 */
function processQuickEKYCChallanData(challanData: any) {
  return {
    challan_details: {
      challans: Array.isArray(challanData.data?.challan_data)
        ? challanData.data.challan_data.map((challan: any) => ({
            ...challan,
            // Add Info key from challan_info if it exists
            Info: challan.challan_info || challan.Info || null
          }))
        : [],
      successful_backends: []
    }
  };
}

// ============================================================================
// SurePare Functions
// ============================================================================

/**
 * Get SurePare configuration
 */
function getSurePareConfig() {
  return {
    apiKey: Deno.env.get('SUREPASS_PRODUCTION_API_KEY') || Deno.env.get('SUREPASS_API_KEY') || '',
    baseUrl: 'https://kyc-api.surepass.io',
    rcEndpoint: "/api/v1/rc/rc-full",
    challanEndpoint: "/api/v1/rc/rc-related/challan-details"
  };
}

/**
 * Prepare SurePare RC API payload
 */
function prepareSurePareRCPayload(registrationNumber: string) {
  return {
    id_number: registrationNumber
  };
}

/**
 * Prepare SurePare RC API headers
 */
function prepareSurePareRCHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  };
}

/**
 * Call SurePare RC API
 */
async function callSurePareRCAPI(registrationNumber: string) {
  const config = getSurePareConfig();
  const url = `${config.baseUrl}${config.rcEndpoint}`;
  const headers = prepareSurePareRCHeaders(config.apiKey);
  const body = prepareSurePareRCPayload(registrationNumber);
  
  console.log(`[SurePare] Making RC API request to: ${url}`);
  
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  
  return response;
}

/**
 * Prepare SurePare Challan API payload
 */
function prepareSurePareChallanPayload(rcNumber: string, chassisNumber: string, engineNumber: string) {
  return {
    rc_number: rcNumber,
    chassis_number: chassisNumber,
    engine_number: engineNumber
  };
}

/**
 * Prepare SurePare Challan API headers
 */
function prepareSurePareChallanHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  };
}

/**
 * Call SurePare Challan API
 */
async function callSurePareChallanAPI(rcNumber: string, chassisNumber: string, engineNumber: string) {
  const config = getSurePareConfig();
  const url = `${config.baseUrl}${config.challanEndpoint}`;
  const headers = prepareSurePareChallanHeaders(config.apiKey);
  const body = prepareSurePareChallanPayload(rcNumber, chassisNumber, engineNumber);
  
  console.log(`[SurePare] Making Challan API request to: ${url}`);
  
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  
  return response;
}

/**
 * Validate SurePare Challan response
 */
function validateSurePareChallanResponse(challanData: any): boolean {
  return challanData?.success !== false;
}

/**
 * Process SurePare Challan data
 */
function processSurePareChallanData(challanData: any) {
  return {
    challan_details: {
      challans: challanData.data?.challan_details?.challans?.map((challan: any) => ({
        challan_number: challan.challan_number,
        challan_status: challan.challan_status,
        amount: challan.amount,
        challan_date: challan.challan_date,
        // Add Info key from challan_info if it exists
        Info: challan.challan_info || challan.Info || null
      })) || [],
      successful_backends: challanData.data?.challan_details?.successful_backends || []
    }
  };
}

// ============================================================================
// Main Handler Functions with Fallback Logic
// ============================================================================

/**
 * Call RC API with fallback: Try QuickEKYC first, fallback to SurePare if status_code = 500
 * Returns both the response and parsed data
 */
async function callRCAPI(registrationNumber: string): Promise<{ response: Response; data: any }> {
  // Primary: Always try QuickEKYC first
  console.log('[RC API] Attempting primary: QuickEKYC');
  const quickEKYResponse = await callQuickEKYCRCAPI(registrationNumber);
  
  // Clone the response to read JSON without consuming the original
  const quickEKYResponseClone = quickEKYResponse.clone();
  const quickEKYData = await quickEKYResponseClone.json();
  
  // Check if QuickEKYC returned status_code 500
  if (quickEKYData?.status_code === 500) {
    console.log('[RC API] QuickEKYC returned status_code 500, falling back to SurePare');
    // Secondary: Fallback to SurePare
    const surePareResponse = await callSurePareRCAPI(registrationNumber);
    const surePareData = await surePareResponse.json();
    return { response: surePareResponse, data: surePareData };
  }
  
  // QuickEKYC succeeded, return its response
  console.log('[RC API] QuickEKYC succeeded, using QuickEKYC response');
  return { response: quickEKYResponse, data: quickEKYData };
}

/**
 * Call Challan API with fallback: Try QuickEKYC first, fallback to SurePare if status_code = 500
 * Returns both the response and parsed data
 */
async function callChallanAPI(rcNumber: string, chassisNumber?: string, engineNumber?: string): Promise<{ response: Response; data: any }> {
  // Primary: Always try QuickEKYC first
  console.log('[Challan API] Attempting primary: QuickEKYC');
  const quickEKYResponse = await callQuickEKYCChallanAPI(rcNumber);
  
  // Clone the response to read JSON without consuming the original
  const quickEKYResponseClone = quickEKYResponse.clone();
  const quickEKYData = await quickEKYResponseClone.json();
  
  // Check if QuickEKYC returned status_code 500
  if (quickEKYData?.status_code === 500) {
    console.log('[Challan API] QuickEKYC returned status_code 500, falling back to SurePare');
    
    // Secondary: Fallback to SurePare (requires chassis and engine numbers)
    if (!chassisNumber || !engineNumber) {
      console.warn('[Challan API] Cannot fallback to SurePare: missing chassis or engine number');
      // Return the QuickEKYC response even though it failed, as we can't fallback
      return { response: quickEKYResponse, data: quickEKYData };
    }
    
    const surePareResponse = await callSurePareChallanAPI(rcNumber, chassisNumber, engineNumber);
    const surePareData = await surePareResponse.json();
    return { response: surePareResponse, data: surePareData };
  }
  
  // QuickEKYC succeeded, return its response
  console.log('[Challan API] QuickEKYC succeeded, using QuickEKYC response');
  return { response: quickEKYResponse, data: quickEKYData };
}

/**
 * Validate Challan response - detects which integration was used based on response structure
 */
function validateChallanResponse(challanData: any): boolean {
  // Check if it's a QuickEKYC response (has status_code)
  if (challanData?.status_code !== undefined) {
    return validateQuickEKYCChallanResponse(challanData);
  }
  // Otherwise, it's a SurePare response (has success field)
  return validateSurePareChallanResponse(challanData);
}

/**
 * Process Challan data - detects which integration was used based on response structure
 */
function processChallanData(challanData: any) {
  // Check if it's a QuickEKYC response (has status_code)
  if (challanData?.status_code !== undefined) {
    return processQuickEKYCChallanData(challanData);
  }
  // Otherwise, it's a SurePare response
  return processSurePareChallanData(challanData);
}

console.log(`Integration selected: ${integrationName || 'default'}`);
console.log(`Using integration: ${isQuickEKYC ? 'QuickEKYC' : 'SurePare'}`);

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

    // Call RC API with fallback: QuickEKYC primary, SurePare secondary if status_code = 500
    const { response: rcResponse, data: providerData } = await callRCAPI(registrationNumber);
    
    // Check for errors
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
    let challanData: any = null;
    if (providerData.data) {
      const data = providerData.data;
      const rcNumber = registrationNumber;
      const chassisNumber = data.vehicle_chasi_number;
      const engineNumber = data.vehicle_engine_number;
      
      console.log(`Got vehicle data - RC: ${rcNumber}, Chassis: ${chassisNumber}, Engine: ${engineNumber}`);
      
      // Check if we have all required parameters for challan call
      // For QuickEKYC, only rcNumber is needed; for SurePare, all three are required
      const canCallChallan = isQuickEKYC 
        ? rcNumber 
        : (rcNumber && chassisNumber && engineNumber);
      
      if (canCallChallan) {
        try {
          // Call Challan API with fallback: QuickEKYC primary, SurePare secondary if status_code = 500
          const { response: challanResponse, data: challanResponseData } = await callChallanAPI(rcNumber, chassisNumber, engineNumber);
          challanData = challanResponseData;
          
          const challanOk = validateChallanResponse(challanData);
          console.log("Challan API response received:", challanOk ? "Success" : "Failed", challanData);
          
          // Add challan data to the registration data
          if (providerData.data && challanData && typeof challanData === 'object' && 'data' in challanData) {
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
    const currentVerificationData: Array<{ field: string; value: any; verified: boolean }> = [];
    
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
          // NOTE: type column modification is commented out per requirements
          // The type should not be modified during Run Safety Check for both add and edit
          const updates: Record<string, any> = {
            // type: 'bus', // COMMENTED OUT: Do not modify type column during safety check
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
    if (challanData && typeof challanData === 'object' && 'data' in challanData && challanData.data) {
      // Process challan data using the appropriate integration handler
      const processedChallanData = processChallanData(challanData);
      
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
