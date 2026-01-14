import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = getSupabaseUrl();
const supabaseServiceKey = getSupabaseServiceRoleKey();

// Integration selector - Hardcoded to use SurePass as primary
const integrationName = 'surepass'; // Hardcoded to SurePass
const isQuickEKYC = false; // SurePass is primary, QuickEKYC is fallback

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
  // Handle both possible response structures:
  // 1. challanData.data.challan_data (old format)
  // 2. challanData.data.challan_details.challans (new format from API)
  const challansArray = 
    Array.isArray(challanData.data?.challan_details?.challans)
      ? challanData.data.challan_details.challans
      : Array.isArray(challanData.data?.challan_data)
        ? challanData.data.challan_data
        : [];
  
  return {
    challan_details: {
      challans: challansArray.map((challan: any) => ({
        ...challan,
        // Ensure challan_number is present (might be challan_no in some responses)
        challan_number: challan.challan_number || challan.challan_no || challan.number,
        // Add Info key from challan_info if it exists
        Info: challan.challan_info || challan.Info || challan.offense_details || null
      })),
      successful_backends: challanData.data?.challan_details?.successful_backends || []
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
    rcEndpoint: "/api/v1/rc/rc-v2",
    challanEndpoint: "/api/v1/rc/rc-related/challan-details"
  };
}

/**
 * Prepare SurePare RC API payload
 */
function prepareSurePareRCPayload(registrationNumber: string) {
  return {
    id_number: registrationNumber,
    enrich  : true
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
 * Format date time to "2026-01-02 5.58pm" format (date with time in IST)
 * Converts UTC to IST (Indian Standard Time, UTC+5:30)
 */
function formatDateTime(date: Date): string {
  // Convert UTC to IST (UTC+5:30)
  // IST is 5 hours 30 minutes ahead of UTC
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = date.getTime() + istOffset;
  const istDate = new Date(istTime);
  
  // Get date in YYYY-MM-DD format using IST
  const year = istDate.getUTCFullYear();
  const month = (istDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = istDate.getUTCDate().toString().padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // Get time in 12-hour format (5.58pm) using IST
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12; // Convert to 12-hour format
  const displayMinutes = minutes.toString().padStart(2, '0');
  const timeStr = `${displayHours}.${displayMinutes}${ampm}`;
  
  return `${dateStr} ${timeStr}`;
}

/**
 * Log error to error_log structure
 */
function createErrorLogEntry(
  provider: 'surepass' | 'quickeyc',
  statusCode: number,
  message: string,
  apiUrl: string, // Full API URL instead of just 'rc' or 'challan'
  payload: any
): any {
  return {
    provider: provider,
    status_code: statusCode,
    msg: message,
    date_time: formatDateTime(new Date()),
    api: apiUrl, // Full API URL
    payload: payload
  };
}

/**
 * Save error log to database
 */
async function saveErrorLog(
  supabase: any,
  vehicleId: string | undefined,
  registrationNumber: string,
  errorEntry: any
): Promise<void> {
  if (!vehicleId) {
    // If no vehicleId, try to find by registration_number
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, error_log')
      .eq('registration_number', registrationNumber)
      .single();
    
    if (!vehicle) {
      console.warn('Cannot save error log: vehicle not found');
      return;
    }
    vehicleId = vehicle.id;
  }

  // Get existing error_log or initialize as empty array
  const { data: vehicleData } = await supabase
    .from('vehicles')
    .select('error_log')
    .eq('id', vehicleId)
    .single();

  const existingErrorLog = vehicleData?.error_log || [];
  const updatedErrorLog = Array.isArray(existingErrorLog) 
    ? [...existingErrorLog, errorEntry]
    : [errorEntry];

  // Update error_log column
  const { error } = await supabase
    .from('vehicles')
    .update({ error_log: updatedErrorLog })
    .eq('id', vehicleId);

  if (error) {
    console.error('Failed to save error log:', error);
  } else {
    console.log('Error log saved successfully');
  }
}

/**
 * Update vehicles table with RC API response data
 */
async function updateVehiclesRCFields(
  supabase: any,
  vehicleId: string | undefined,
  registrationNumber: string,
  provider: 'surepass' | 'quickeyc',
  statusCode: number | string,
  rcData: any,
  isSuccess: boolean
): Promise<void> {
  if (!vehicleId) {
    // If no vehicleId, try to find by registration_number
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, success_api_count, error_api_count')
      .eq('registration_number', registrationNumber)
      .single();
    
    if (!vehicle) {
      console.warn('Cannot update RC fields: vehicle not found');
      return;
    }
    vehicleId = vehicle.id;
  }

  // Get current counts
  const { data: vehicleData } = await supabase
    .from('vehicles')
    .select('success_api_count, error_api_count')
    .eq('id', vehicleId)
    .single();

  const currentSuccessCount = vehicleData?.success_api_count || 0;
  const currentErrorCount = vehicleData?.error_api_count || 0;

  // Clean RC data: Remove challan_details if present (challan data is stored separately in vehicle_challans table)
  let cleanedRcData = rcData;
  if (cleanedRcData && typeof cleanedRcData === 'object') {
    // Create a copy to avoid mutating the original
    cleanedRcData = { ...cleanedRcData };
    
    // Remove challan_details from data object if it exists
    if (cleanedRcData.data && typeof cleanedRcData.data === 'object' && 'challan_details' in cleanedRcData.data) {
      const { challan_details, ...restData } = cleanedRcData.data;
      cleanedRcData.data = restData;
    }
    
    // Also remove challan_details from root level if it exists
    if ('challan_details' in cleanedRcData) {
      const { challan_details, ...rest } = cleanedRcData;
      cleanedRcData = rest;
    }
  }

  // Prepare update object
  const updates: Record<string, any> = {
    provider: provider,
    status_code: String(statusCode),
    current_rc_data: cleanedRcData,
    rc_status: isSuccess ? 'success' : 'error'
  };

  // Update counts based on success/error
  if (isSuccess) {
    updates.success_api_count = currentSuccessCount + 1;
  } else {
    updates.error_api_count = currentErrorCount + 1;
  }

  // Update vehicles table
  const { error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', vehicleId);

  if (error) {
    console.error('Failed to update RC fields:', error);
  } else {
    console.log(`RC fields updated successfully (provider: ${provider}, success: ${isSuccess})`);
  }
}

/**
 * Update or create vehicle_challans table record
 */
async function updateVehicleChallans(
  supabase: any,
  vehicleId: string | undefined,
  registrationNumber: string,
  provider: 'surepass' | 'quickeyc',
  statusCode: number | string,
  challanData: any,
  isSuccess: boolean
): Promise<void> {
  if (!vehicleId) {
    // If no vehicleId, try to find by registration_number
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('registration_number', registrationNumber)
      .single();
    
    if (!vehicle) {
      console.warn('Cannot update challan data: vehicle not found');
      return;
    }
    vehicleId = vehicle.id;
  }

  // Check if vehicle_challans record exists
  const { data: existingChallan } = await supabase
    .from('vehicle_challans')
    .select('id, success_api_count, error_api_count, challan_history_log')
    .eq('vehicle_id', vehicleId)
    .single();

  const currentSuccessCount = existingChallan?.success_api_count || 0;
  const currentErrorCount = existingChallan?.error_api_count || 0;
  const existingHistoryLog = existingChallan?.challan_history_log || {};

  // Create history entry
  const timestamp = new Date().toISOString();
  const historyEntry = {
    provider: provider,
    status_code: String(statusCode),
    success: isSuccess,
    data: challanData,
    timestamp: timestamp
  };

  // Update history log
  const updatedHistoryLog = {
    ...existingHistoryLog,
    [timestamp]: historyEntry
  };

  // Prepare update/insert object
  const challanRecord: Record<string, any> = {
    vehicle_id: vehicleId,
    latest_challan_data: challanData,
    challan_status: isSuccess,
    challan_status_code: String(statusCode),
    provider: provider,
    challan_history_log: updatedHistoryLog,
    updated_at: new Date().toISOString()
  };

  // Update counts based on success/error
  if (isSuccess) {
    challanRecord.success_api_count = currentSuccessCount + 1;
    challanRecord.error_api_count = currentErrorCount;
  } else {
    challanRecord.success_api_count = currentSuccessCount;
    challanRecord.error_api_count = currentErrorCount + 1;
  }

  if (existingChallan) {
    // Update existing record
    const { error } = await supabase
      .from('vehicle_challans')
      .update(challanRecord)
      .eq('id', existingChallan.id);

    if (error) {
      console.error('Failed to update vehicle_challans:', error);
    } else {
      console.log(`Vehicle challans updated successfully (provider: ${provider}, success: ${isSuccess})`);
    }
  } else {
    // Create new record
    challanRecord.created_at = new Date().toISOString();
    const { error } = await supabase
      .from('vehicle_challans')
      .insert(challanRecord);

    if (error) {
      console.error('Failed to create vehicle_challans:', error);
    } else {
      console.log(`Vehicle challans created successfully (provider: ${provider}, success: ${isSuccess})`);
    }
  }
}

/**
 * Call RC API with fallback: Try SurePass first, fallback to QuickEKYC if error
 * Returns both the response and parsed data, provider info, and error log entry if any
 */
async function callRCAPI(
  registrationNumber: string,
  supabase: any,
  vehicleId: string | undefined
): Promise<{ response: Response; data: any; provider?: 'surepass' | 'quickeyc'; statusCode?: number; errorLog?: any }> {
  // Primary: Always try SurePass first
  console.log('[RC API] Attempting primary: SurePass');
  const surePassPayload = prepareSurePareRCPayload(registrationNumber);
  
  let surePassResponse: Response;
  let surePassData: any;
  let surePassError: any = null;

  try {
    const surePassConfig = getSurePareConfig();
    const surePassApiUrl = `${surePassConfig.baseUrl}${surePassConfig.rcEndpoint}`;
    
    surePassResponse = await callSurePareRCAPI(registrationNumber);
    surePassData = await surePassResponse.json();
    
    // Check if SurePass failed (not ok or success = false)
    if (!surePassResponse.ok || surePassData?.success === false) {
      surePassError = {
        statusCode: surePassResponse.status,
        message: surePassData?.message || surePassData?.error || 'SurePass API error',
        data: surePassData
      };
      
      // Log SurePass error
      const errorEntry = createErrorLogEntry(
        'surepass',
        surePassResponse.status,
        surePassError.message,
        surePassApiUrl,
        surePassPayload
      );
      
      await saveErrorLog(supabase, vehicleId, registrationNumber, errorEntry);
      
      // Update vehicles table with error
      await updateVehiclesRCFields(
        supabase,
        vehicleId,
        registrationNumber,
        'surepass',
        surePassResponse.status,
        surePassData,
        false
      );
      
      console.log('[RC API] SurePass failed, falling back to QuickEKYC');
      
      // Secondary: Fallback to QuickEKYC
      const quickEKYConfig = getQuickEKYCConfig();
      const quickEKYApiUrl = `${quickEKYConfig.baseUrl}${quickEKYConfig.rcEndpoint}`;
      const quickEKYPayload = prepareQuickEKYCRCPayload(registrationNumber, quickEKYConfig.apiKey);
      const quickEKYResponse = await callQuickEKYCRCAPI(registrationNumber);
      const quickEKYData = await quickEKYResponse.json();
      
      // Determine if QuickEKYC succeeded or failed
      const quickEKYSuccess = quickEKYData?.status_code === 200 && quickEKYResponse.ok;
      const quickEKYStatusCode = quickEKYResponse.status || (quickEKYData?.status_code || 500);
      
      if (!quickEKYSuccess) {
        const quickEKYErrorEntry = createErrorLogEntry(
          'quickeyc',
          quickEKYStatusCode,
          quickEKYData?.message || 'QuickEKYC API error',
          quickEKYApiUrl,
          quickEKYPayload
        );
        await saveErrorLog(supabase, vehicleId, registrationNumber, quickEKYErrorEntry);
      }
      
      // Update vehicles table with QuickEKYC result
      await updateVehiclesRCFields(
        supabase,
        vehicleId,
        registrationNumber,
        'quickeyc',
        quickEKYStatusCode,
        quickEKYData,
        quickEKYSuccess
      );
      
      return { 
        response: quickEKYResponse, 
        data: quickEKYData, 
        provider: 'quickeyc',
        statusCode: quickEKYStatusCode,
        errorLog: errorEntry 
      };
    }
    
    // SurePass succeeded, update vehicles table and return its response
    console.log('[RC API] SurePass succeeded, using SurePass response');
    
    // Update vehicles table with success
    await updateVehiclesRCFields(
      supabase,
      vehicleId,
      registrationNumber,
      'surepass',
      surePassResponse.status,
      surePassData,
      true
    );
    
    return { 
      response: surePassResponse, 
      data: surePassData,
      provider: 'surepass',
      statusCode: surePassResponse.status
    };
    
  } catch (error) {
    // Network or other error with SurePass
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RC API] SurePass exception:', errorMessage);
    
    const surePassConfig = getSurePareConfig();
    const surePassApiUrl = `${surePassConfig.baseUrl}${surePassConfig.rcEndpoint}`;
    
    const errorEntry = createErrorLogEntry(
      'surepass',
      0, // 0 indicates network/exception error
      errorMessage,
      surePassApiUrl,
      surePassPayload
    );
    
    await saveErrorLog(supabase, vehicleId, registrationNumber, errorEntry);
    
    // Update vehicles table with SurePass error
    await updateVehiclesRCFields(
      supabase,
      vehicleId,
      registrationNumber,
      'surepass',
      0,
      { error: errorMessage },
      false
    );
    
    // Fallback to QuickEKYC
    console.log('[RC API] SurePass exception, falling back to QuickEKYC');
    try {
      const quickEKYConfig = getQuickEKYCConfig();
      const quickEKYApiUrl = `${quickEKYConfig.baseUrl}${quickEKYConfig.rcEndpoint}`;
      const quickEKYPayload = prepareQuickEKYCRCPayload(registrationNumber, quickEKYConfig.apiKey);
      const quickEKYResponse = await callQuickEKYCRCAPI(registrationNumber);
      const quickEKYData = await quickEKYResponse.json();
      
      // Determine if QuickEKYC succeeded or failed
      const quickEKYSuccess = quickEKYData?.status_code === 200 && quickEKYResponse.ok;
      const quickEKYStatusCode = quickEKYResponse.status || (quickEKYData?.status_code || 500);
      
      if (!quickEKYSuccess) {
        const quickEKYErrorEntry = createErrorLogEntry(
          'quickeyc',
          quickEKYStatusCode,
          quickEKYData?.message || 'QuickEKYC API error',
          quickEKYApiUrl,
          quickEKYPayload
        );
        await saveErrorLog(supabase, vehicleId, registrationNumber, quickEKYErrorEntry);
      }
      
      // Update vehicles table with QuickEKYC result
      await updateVehiclesRCFields(
        supabase,
        vehicleId,
        registrationNumber,
        'quickeyc',
        quickEKYStatusCode,
        quickEKYData,
        quickEKYSuccess
      );
      
      return { 
        response: quickEKYResponse, 
        data: quickEKYData,
        provider: 'quickeyc',
        statusCode: quickEKYStatusCode,
        errorLog: errorEntry 
      };
    } catch (quickEKYError) {
      const quickEKYConfig = getQuickEKYCConfig();
      const quickEKYApiUrl = `${quickEKYConfig.baseUrl}${quickEKYConfig.rcEndpoint}`;
      const quickEKYErrorMessage = quickEKYError instanceof Error ? quickEKYError.message : 'Unknown error';
      const quickEKYErrorEntry = createErrorLogEntry(
        'quickeyc',
        0,
        quickEKYErrorMessage,
        quickEKYApiUrl,
        prepareQuickEKYCRCPayload(registrationNumber, quickEKYConfig.apiKey)
      );
      await saveErrorLog(supabase, vehicleId, registrationNumber, quickEKYErrorEntry);
      
      // Update vehicles table with QuickEKYC error
      await updateVehiclesRCFields(
        supabase,
        vehicleId,
        registrationNumber,
        'quickeyc',
        0,
        { error: quickEKYErrorMessage },
        false
      );
      
      throw error; // Re-throw the original SurePass error
    }
  }
}

/**
 * Call Challan API with fallback: Try SurePass first, fallback to QuickEKYC if error
 * Returns both the response and parsed data, provider info, and error log entry if any
 */
async function callChallanAPI(
  rcNumber: string,
  chassisNumber: string | undefined,
  engineNumber: string | undefined,
  supabase: any,
  vehicleId: string | undefined,
  registrationNumber: string
): Promise<{ response: Response; data: any; provider?: 'surepass' | 'quickeyc'; statusCode?: number; errorLog?: any }> {
  // Primary: Always try SurePass first
  console.log('[Challan API] Attempting primary: SurePass');
  
  // SurePass requires chassis and engine numbers
  if (!chassisNumber || !engineNumber) {
    console.warn('[Challan API] Cannot use SurePass: missing chassis or engine number, trying QuickEKYC');
    // Fallback directly to QuickEKYC if we don't have required params
    const quickEKYConfig = getQuickEKYCConfig();
    const quickEKYApiUrl = `${quickEKYConfig.baseUrl}${quickEKYConfig.challanEndpoint}`;
    const quickEKYPayload = prepareQuickEKYCChallanPayload(rcNumber, quickEKYConfig.apiKey);
    const quickEKYResponse = await callQuickEKYCChallanAPI(rcNumber);
    const quickEKYData = await quickEKYResponse.json();
    
    // Determine if QuickEKYC succeeded or failed
    const quickEKYSuccess = validateQuickEKYCChallanResponse(quickEKYData) && quickEKYResponse.ok;
    const quickEKYStatusCode = quickEKYResponse.status || (quickEKYData?.status_code || 500);
    
    if (!quickEKYSuccess) {
      const errorEntry = createErrorLogEntry(
        'quickeyc',
        quickEKYStatusCode,
        quickEKYData?.message || 'QuickEKYC API error',
        quickEKYApiUrl,
        quickEKYPayload
      );
      await saveErrorLog(supabase, vehicleId, registrationNumber, errorEntry);
    }
    
    // Update vehicle_challans table
    await updateVehicleChallans(
      supabase,
      vehicleId,
      registrationNumber,
      'quickeyc',
      quickEKYStatusCode,
      quickEKYData,
      quickEKYSuccess
    );
    
    return { 
      response: quickEKYResponse, 
      data: quickEKYData,
      provider: 'quickeyc',
      statusCode: quickEKYStatusCode
    };
  }

  const surePassConfig = getSurePareConfig();
  const surePassApiUrl = `${surePassConfig.baseUrl}${surePassConfig.challanEndpoint}`;
  const surePassPayload = prepareSurePareChallanPayload(rcNumber, chassisNumber, engineNumber);
  let surePassResponse: Response;
  let surePassData: any;

  try {
    surePassResponse = await callSurePareChallanAPI(rcNumber, chassisNumber, engineNumber);
    surePassData = await surePassResponse.json();
    
    // Check if SurePass failed
    if (!surePassResponse.ok || surePassData?.success === false) {
      const errorMessage = surePassData?.message || surePassData?.error || 'SurePass API error';
      console.log('[Challan API] SurePass failed, falling back to QuickEKYC');
      
      // Log SurePass error
      const errorEntry = createErrorLogEntry(
        'surepass',
        surePassResponse.status,
        errorMessage,
        surePassApiUrl,
        surePassPayload
      );
      
      await saveErrorLog(supabase, vehicleId, registrationNumber, errorEntry);
      
      // Update vehicle_challans table with SurePass error
      await updateVehicleChallans(
        supabase,
        vehicleId,
        registrationNumber,
        'surepass',
        surePassResponse.status,
        surePassData,
        false
      );
      
      // Secondary: Fallback to QuickEKYC
      const quickEKYConfig = getQuickEKYCConfig();
      const quickEKYApiUrl = `${quickEKYConfig.baseUrl}${quickEKYConfig.challanEndpoint}`;
      const quickEKYPayload = prepareQuickEKYCChallanPayload(rcNumber, quickEKYConfig.apiKey);
      const quickEKYResponse = await callQuickEKYCChallanAPI(rcNumber);
      const quickEKYData = await quickEKYResponse.json();
      
      // Determine if QuickEKYC succeeded or failed
      const quickEKYSuccess = validateQuickEKYCChallanResponse(quickEKYData) && quickEKYResponse.ok;
      const quickEKYStatusCode = quickEKYResponse.status || (quickEKYData?.status_code || 500);
      
      if (!quickEKYSuccess) {
        const quickEKYErrorEntry = createErrorLogEntry(
          'quickeyc',
          quickEKYStatusCode,
          quickEKYData?.message || 'QuickEKYC API error',
          quickEKYApiUrl,
          quickEKYPayload
        );
        await saveErrorLog(supabase, vehicleId, registrationNumber, quickEKYErrorEntry);
      }
      
      // Update vehicle_challans table with QuickEKYC result
      await updateVehicleChallans(
        supabase,
        vehicleId,
        registrationNumber,
        'quickeyc',
        quickEKYStatusCode,
        quickEKYData,
        quickEKYSuccess
      );
      
      return { 
        response: quickEKYResponse, 
        data: quickEKYData,
        provider: 'quickeyc',
        statusCode: quickEKYStatusCode,
        errorLog: errorEntry 
      };
    }
    
    // SurePass succeeded, update vehicle_challans table and return its response
    console.log('[Challan API] SurePass succeeded, using SurePass response');
    
    // Update vehicle_challans table with success
    await updateVehicleChallans(
      supabase,
      vehicleId,
      registrationNumber,
      'surepass',
      surePassResponse.status,
      surePassData,
      true
    );
    
    return { 
      response: surePassResponse, 
      data: surePassData,
      provider: 'surepass',
      statusCode: surePassResponse.status
    };
    
  } catch (error) {
    // Network or other error with SurePass
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Challan API] SurePass exception:', errorMessage);
    
    const errorEntry = createErrorLogEntry(
      'surepass',
      0, // 0 indicates network/exception error
      errorMessage,
      surePassApiUrl,
      surePassPayload
    );
    
    await saveErrorLog(supabase, vehicleId, registrationNumber, errorEntry);
    
    // Update vehicle_challans table with SurePass error
    await updateVehicleChallans(
      supabase,
      vehicleId,
      registrationNumber,
      'surepass',
      0,
      { error: errorMessage },
      false
    );
    
    // Fallback to QuickEKYC
    console.log('[Challan API] SurePass exception, falling back to QuickEKYC');
    try {
      const quickEKYConfig = getQuickEKYCConfig();
      const quickEKYApiUrl = `${quickEKYConfig.baseUrl}${quickEKYConfig.challanEndpoint}`;
      const quickEKYPayload = prepareQuickEKYCChallanPayload(rcNumber, quickEKYConfig.apiKey);
      const quickEKYResponse = await callQuickEKYCChallanAPI(rcNumber);
      const quickEKYData = await quickEKYResponse.json();
      
      // Determine if QuickEKYC succeeded or failed
      const quickEKYSuccess = validateQuickEKYCChallanResponse(quickEKYData) && quickEKYResponse.ok;
      const quickEKYStatusCode = quickEKYResponse.status || (quickEKYData?.status_code || 500);
      
      if (!quickEKYSuccess) {
        const quickEKYErrorEntry = createErrorLogEntry(
          'quickeyc',
          quickEKYStatusCode,
          quickEKYData?.message || 'QuickEKYC API error',
          quickEKYApiUrl,
          quickEKYPayload
        );
        await saveErrorLog(supabase, vehicleId, registrationNumber, quickEKYErrorEntry);
      }
      
      // Update vehicle_challans table with QuickEKYC result
      await updateVehicleChallans(
        supabase,
        vehicleId,
        registrationNumber,
        'quickeyc',
        quickEKYStatusCode,
        quickEKYData,
        quickEKYSuccess
      );
      
      return { 
        response: quickEKYResponse, 
        data: quickEKYData,
        provider: 'quickeyc',
        statusCode: quickEKYStatusCode,
        errorLog: errorEntry 
      };
    } catch (quickEKYError) {
      const quickEKYConfig = getQuickEKYCConfig();
      const quickEKYApiUrl = `${quickEKYConfig.baseUrl}${quickEKYConfig.challanEndpoint}`;
      const quickEKYErrorMessage = quickEKYError instanceof Error ? quickEKYError.message : 'Unknown error';
      const quickEKYErrorEntry = createErrorLogEntry(
        'quickeyc',
        0,
        quickEKYErrorMessage,
        quickEKYApiUrl,
        prepareQuickEKYCChallanPayload(rcNumber, quickEKYConfig.apiKey)
      );
      await saveErrorLog(supabase, vehicleId, registrationNumber, quickEKYErrorEntry);
      
      // Update vehicle_challans table with QuickEKYC error
      await updateVehicleChallans(
        supabase,
        vehicleId,
        registrationNumber,
        'quickeyc',
        0,
        { error: quickEKYErrorMessage },
        false
      );
      
      throw error; // Re-throw the original SurePass error
    }
  }
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
console.log(`Using integration: SurePass (primary), QuickEKYC (fallback)`);

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

    // Call RC API with fallback: SurePass primary, QuickEKYC secondary if error
    const { response: rcResponse, data: providerData, provider: rcProvider, statusCode: rcStatusCode } = await callRCAPI(registrationNumber, supabase, vehicleId);
    
    // Note: Even if RC API fails, we continue to store the error in history
    // The vehicles table RC fields are already updated in callRCAPI function
    
    // Extract required data for challan API call
    let challanData: any = null;
    if (providerData.data) {
      const data = providerData.data;
      const rcNumber = registrationNumber;
      const chassisNumber = data.vehicle_chasi_number;
      const engineNumber = data.vehicle_engine_number;
      
      console.log(`Got vehicle data - RC: ${rcNumber}, Chassis: ${chassisNumber}, Engine: ${engineNumber}`);
      
      // Check if we have all required parameters for challan call
      // For QuickEKYC, only rcNumber is needed; for SurePass, all three are required
      // Since SurePass is primary, we prefer having all three, but can fallback to QuickEKYC with just rcNumber
      const canCallChallan = rcNumber && (chassisNumber && engineNumber || true); // Can always try (SurePass needs all, QuickEKYC needs only rcNumber)
      
      if (canCallChallan) {
        try {
          // Call Challan API with fallback: SurePass primary, QuickEKYC secondary if error
          const { response: challanResponse, data: challanResponseData, provider: challanProvider, statusCode: challanStatusCode } = await callChallanAPI(
            rcNumber, 
            chassisNumber, 
            engineNumber,
            supabase,
            vehicleId,
            registrationNumber
          );
          challanData = challanResponseData;
          
          // Note: vehicle_challans table is already updated in callChallanAPI function
          console.log(`Challan API completed - Provider: ${challanProvider}, Status: ${challanStatusCode}`);
          
          const challanOk = validateChallanResponse(challanData);
          console.log("Challan API response received:", challanOk ? "Success" : "Failed", challanData);
          
          // Note: Challan data is stored in vehicle_challans table, not in verification_data
          // Do not add challan_details to providerData.data
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
        
        // Note: rc_history_log is no longer stored in verification_data
        // RC history can be accessed from vehicles.current_rc_data if needed
        
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
    
    // Note: Challan data is NOT stored in verification_data
    // Challan data is stored separately in vehicle_challans table via updateVehicleChallans function
    // Only RC history should be stored in verification_data
    
    // Store the current verification data in the log with timestamp as key
    // Note: Only verification_log is stored in verification_data
    // RC history is maintained separately in vehicles.current_rc_data
    const updatedVerificationLog = {
      ...existingVerificationLog,
      [verificationDate]: currentVerificationData
    };
    
    // Create the verification log entry in the correct format
    // Note: rc_history_log is NOT stored in verification_data - only verification_log is stored
    // RC history is maintained in vehicles.current_rc_data and can be accessed from there
    const verificationLogEntry = {
      field: "verification_log",
      value: updatedVerificationLog,
      verified: true
    };
    
    // The complete transformed data array should have only the verification log
    // rc_history_log is removed as it's redundant (same data is in verification_log)
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
