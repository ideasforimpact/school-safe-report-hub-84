import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';
import {
  recordVehicleVerificationApiCall,
  VEHICLE_VERIFY_PRIMARY_PROVIDER,
  VEHICLE_VERIFY_FALLBACK_PROVIDER,
} from '../_shared/vehicleVerificationApiCalls.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Logs one external API outcome to vehicle_verification_api_calls (never throws). */
async function safeVehicleApiCallLog(
  supabase: any,
  vehicleId: string | undefined,
  params: {
    operation: 'rc' | 'challan';
    provider: string;
    isSuccess: boolean;
    isMultiple?: boolean;
  },
) {
  if (!vehicleId) return;
  try {
    await recordVehicleVerificationApiCall({
      supabase,
      vehicleId,
      primaryProvider: VEHICLE_VERIFY_PRIMARY_PROVIDER,
      operation: params.operation,
      provider: params.provider,
      isSuccess: params.isSuccess,
      isMultiple: params.isMultiple,
    });
  } catch (e) {
    console.error('[vehicle-verify] vehicle_verification_api_calls log failed:', e);
  }
}

const supabaseUrl = getSupabaseUrl();
const supabaseServiceKey = getSupabaseServiceRoleKey();

// ============================================================================
// Provider order (dynamic) — resolved from the PRIMARY_RC env var in
// _shared/vehicleVerificationApiCalls.ts, so swapping the primary/fallback
// provider needs NO code change. Set PRIMARY_RC=surepass (default) for SurePass
// primary + QuickEKYC fallback, or PRIMARY_RC=quickekyc for the reverse.
// ============================================================================
type ProviderName = 'surepass' | 'quickeyc';

const PRIMARY_PROVIDER: ProviderName = VEHICLE_VERIFY_PRIMARY_PROVIDER;
const FALLBACK_PROVIDER: ProviderName = VEHICLE_VERIFY_FALLBACK_PROVIDER;

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
    rcEndpoint: "/api/v1/rc/rc_sp_v1",
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
    // Env-configurable so the primary RC endpoint can be swapped to a masked one per
    // environment without a code change. Defaults to the existing rc-v2 endpoint.
    rcEndpoint: Deno.env.get('SUREPASS_RC_ENDPOINT') || "/api/v1/rc/rc-v2",
    challanEndpoint: "/api/v1/rc/rc-related/challan-details"
  };
}

/**
 * Prepare SurePare RC API payload
 */
function prepareSurePareRCPayload(registrationNumber: string) {
  return {
    id_number: registrationNumber,
    // enrich  : true
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
 * Generate a short 5-digit process id for linking
 * related challan attempts (primary + fallback).
 */
function generateProcessId(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
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
 * Normalize a raw provider RC response into the single canonical shape the app
 * reads (must stay in sync with VERIFICATION_FIELD_ORDER in
 * src/utils/transport-safety/documentStatusUtils.ts). Returns ONLY the inner
 * `data` object; callers wrap it as `{ ...raw, data: normalizeRcData(raw, provider) }`.
 *
 * Both SurePass (`rc-full`) and QuickEKYC (`rc_sp_v1`) mirror the VAHAN field
 * names, so the base mapping is identity. If a QuickEKYC sample ever shows a
 * differing key, add it as `?? src.<alias>` on the affected field only.
 */
/**
 * QuickEKYC returns RC dates as DD-MM-YYYY (e.g. "29-06-2027"); SurePass returns
 * ISO YYYY-MM-DD. The app parses via `new Date(value)`, which rejects DD-MM-YYYY
 * (Invalid Date → "Not Available"). Convert DD-MM-YYYY to ISO; leave every other
 * shape (ISO, "6/2022", "2022-06", non-strings, null) untouched.
 */
function toIsoDate(value: any): any {
  if (typeof value !== 'string') return value;
  const m = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : value;
}

function normalizeRcData(raw: any, _provider: 'surepass' | 'quickeyc'): any {
  // Providers nest the RC fields under `.data`; guard single vs. double nesting.
  const src = (raw && typeof raw === 'object'
    ? (raw.data?.data ?? raw.data ?? raw)
    : {}) as Record<string, any>;

  const registrationDate = toIsoDate(src.registration_date ?? null);
  const registrationYear = registrationDate
    ? new Date(registrationDate).getFullYear()
    : null;

  return {
    display_type: src.maker_model ?? null,
    display_year: registrationYear && !Number.isNaN(registrationYear) ? registrationYear : null,
    rc_number: src.rc_number ?? src.registration_number ?? null,
    fit_up_to: toIsoDate(src.fit_up_to ?? null),
    registration_date: registrationDate,
    owner_name: src.owner_name ?? null,
    father_name: src.father_name ?? null,
    present_address: src.present_address ?? null,
    permanent_address: src.permanent_address ?? null,
    vehicle_category: src.vehicle_category ?? null,
    vehicle_chasi_number: src.vehicle_chasi_number ?? null,
    vehicle_engine_number: src.vehicle_engine_number ?? null,
    maker_description: src.maker_description ?? null,
    maker_model: src.maker_model ?? null,
    body_type: src.body_type ?? null,
    fuel_type: src.fuel_type ?? null,
    color: src.color ?? null,
    norms_type: src.norms_type ?? null,
    financer: src.financer ?? null,
    insurance_company: src.insurance_company ?? null,
    insurance_policy_number: src.insurance_policy_number ?? null,
    insurance_upto: toIsoDate(src.insurance_upto ?? null),
    manufacturing_date: src.manufacturing_date ?? null,
    manufacturing_date_formatted: src.manufacturing_date_formatted ?? null,
    registered_at: src.registered_at ?? null,
    latest_by: toIsoDate(src.latest_by ?? null),
    less_info: src.less_info ?? null,
    tax_upto: toIsoDate(src.tax_upto ?? null),
    tax_paid_upto: toIsoDate(src.tax_paid_upto ?? null),
    cubic_capacity: src.cubic_capacity ?? null,
    vehicle_gross_weight: src.vehicle_gross_weight ?? null,
    no_cylinders: src.no_cylinders ?? null,
    seat_capacity: src.seat_capacity ?? null,
    sleeper_capacity: src.sleeper_capacity ?? null,
    standing_capacity: src.standing_capacity ?? null,
    wheelbase: src.wheelbase ?? null,
    unladen_weight: src.unladen_weight ?? null,
    vehicle_category_description: src.vehicle_category_description ?? null,
    pucc_number: src.pucc_number ?? null,
    pucc_upto: toIsoDate(src.pucc_upto ?? null),
    owner_number: src.owner_number ?? null,
    rc_status: src.rc_status ?? null,
    // Preserve masking flags (masked_chassis / masked_engine / masked_owner_name) so the
    // UI can decide whether to show an UNMASK control. Display transforms exclude this key.
    response_metadata: src.response_metadata ?? null,
  };
}

/**
 * Normalize a single challan item into the canonical shape every consumer reads.
 * Consumers access these keys with provider-specific fallbacks (challan_number ||
 * challan_no || number, amount || challan_amount, challan_date_time || challan_date,
 * Info || challan_info || offense_details, plus accused_name / owner_name /
 * challan_place), so we populate ALL of them from whichever alias a provider
 * supplied. Original fields are spread first so nothing provider-specific is lost.
 * `ownerName` is the vehicle owner name from the response's top level (e.g.
 * QuickEKYC's `data.owner_name`) — providers don't put it on each challan item,
 * so it's passed in as a fallback for challans that have no per-item accused_name.
 */
function normalizeChallanItem(c: any, ownerName: string | null = null): any {
  const challanNumber = c?.challan_number ?? c?.challan_no ?? c?.number ?? null;
  const amount = c?.amount ?? c?.challan_amount ?? null;
  const challanDate = c?.challan_date ?? c?.challan_date_time ?? c?.challan_time ?? null;
  const challanDateTime = c?.challan_date_time ?? c?.challan_date ?? c?.challan_time ?? null;
  const info = c?.challan_info ?? c?.Info ?? c?.offense_details ?? null;
  return {
    ...c,
    challan_number: challanNumber,
    challan_no: challanNumber,
    number: challanNumber,
    challan_status: c?.challan_status ?? null,
    amount,
    challan_amount: amount,
    challan_date: challanDate,
    challan_date_time: challanDateTime,
    Info: info,
    challan_info: info,
    offense_details: info,
    accused_name: c?.accused_name ?? c?.owner_name ?? ownerName ?? null,
    challan_place: c?.challan_place ?? null,
  };
}

/**
 * Normalize a raw provider challan response into ONE canonical shape regardless of
 * provider (QuickEKYC vs SurePass), so `vehicle_challans.latest_challan_data` and the
 * returned challan payload are consistent. Preserves the provider wrapper (status_code
 * / success / data) and only rewrites the challan items under `data.challan_details.
 * challans`. Error / validation payloads (no challans array) pass through untouched.
 */
function normalizeChallanData(raw: any, _provider: 'surepass' | 'quickeyc'): any {
  if (!raw || typeof raw !== 'object') return raw;

  const details = raw?.data?.challan_details ?? raw?.challan_details ?? null;
  const challans = Array.isArray(details?.challans) ? details.challans : null;
  const legacy = Array.isArray(raw?.data?.challan_data) ? raw.data.challan_data : null;
  const items = challans ?? legacy;

  if (!items) return raw; // error/validation payloads have no challans — leave as-is

  const ownerName = raw?.data?.owner_name ?? raw?.owner_name ?? null;

  const normalizedDetails = {
    ...(details ?? {}),
    challans: items.map((c: any) => normalizeChallanItem(c, ownerName)),
  };

  if (raw?.data?.challan_details || raw?.data?.challan_data) {
    return { ...raw, data: { ...raw.data, challan_details: normalizedDetails } };
  }
  return { ...raw, challan_details: normalizedDetails };
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

  // When both providers fail, set verification_status to 'failed'
  if (!isSuccess) {
    updates.verification_status = 'failed';
  }

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
  isSuccess: boolean,
  processId?: string,
  parentProcessId?: string | null,
  bothFallback?: boolean
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
  const finalProcessId = processId || generateProcessId();
  const historyEntry: any = {
    provider: provider,
    status_code: String(statusCode),
    success: isSuccess,
    data: challanData,
    timestamp: timestamp,
    process_id: finalProcessId
  };

  // When both providers fail in a single flow, link the
  // fallback attempt to the primary via parent_process_id
  // and mark it with bothFallback = true so the UI can
  // safely hide the duplicate entry in history.
  if (parentProcessId) {
    historyEntry.parent_process_id = parentProcessId;
  }
  if (bothFallback !== undefined) {
    historyEntry.bothFallback = bothFallback;
  }

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
 * Build a provider-agnostic RC strategy. Both providers expose the same shape
 * (call / isSuccess / errorMessage), so the generic runner below is identical
 * regardless of which one is primary vs. fallback.
 */
function makeRcProvider(name: ProviderName, registrationNumber: string) {
  if (name === 'quickeyc') {
    const config = getQuickEKYCConfig();
    return {
      name,
      apiUrl: `${config.baseUrl}${config.rcEndpoint}`,
      payload: prepareQuickEKYCRCPayload(registrationNumber, config.apiKey),
      call: () => callQuickEKYCRCAPI(registrationNumber),
      isSuccess: (response: Response, data: any) => data?.status_code === 200 && response.ok,
      errorMessage: (data: any) => data?.message || 'QuickEKYC API error',
    };
  }
  const config = getSurePareConfig();
  return {
    name,
    apiUrl: `${config.baseUrl}${config.rcEndpoint}`,
    payload: prepareSurePareRCPayload(registrationNumber),
    call: () => callSurePareRCAPI(registrationNumber),
    isSuccess: (response: Response, data: any) => response.ok && data?.success !== false,
    errorMessage: (data: any) => data?.message || data?.error || 'SurePass API error',
  };
}

/**
 * Run one RC provider attempt end-to-end: fetch, normalize, and persist the error
 * log + vehicles RC fields + api-call metrics. On a network exception it records the
 * failure and returns { threw: true } so the caller can decide whether to fall back
 * or surface the error.
 */
async function attemptRc(
  prov: ReturnType<typeof makeRcProvider>,
  supabase: any,
  vehicleId: string | undefined,
  registrationNumber: string,
  isMultiple: boolean,
): Promise<{ ok: boolean; threw: boolean; error?: any; statusCode: number; result?: any; response?: Response }> {
  let response: Response;
  let data: any;
  try {
    response = await prov.call();
    data = await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[RC API] ${prov.name} exception:`, message);
    const errorEntry = createErrorLogEntry(prov.name, 0, message, prov.apiUrl, prov.payload);
    await saveErrorLog(supabase, vehicleId, registrationNumber, errorEntry);
    await updateVehiclesRCFields(supabase, vehicleId, registrationNumber, prov.name, 0, { error: message }, false);
    await safeVehicleApiCallLog(supabase, vehicleId, { operation: 'rc', provider: prov.name, isSuccess: false, isMultiple });
    return { ok: false, threw: true, error, statusCode: 0 };
  }

  const success = prov.isSuccess(response, data);
  const statusCode = response.status || data?.status_code || 500;
  // Normalize to the canonical RC shape (keeps wrapper fields like status_code / success).
  const result = { ...data, data: normalizeRcData(data, prov.name) };

  if (!success) {
    const errorEntry = createErrorLogEntry(prov.name, statusCode, prov.errorMessage(data), prov.apiUrl, prov.payload);
    await saveErrorLog(supabase, vehicleId, registrationNumber, errorEntry);
  }

  await updateVehiclesRCFields(supabase, vehicleId, registrationNumber, prov.name, statusCode, result, success);
  await safeVehicleApiCallLog(supabase, vehicleId, { operation: 'rc', provider: prov.name, isSuccess: success, isMultiple });

  return { ok: success, threw: false, statusCode, result, response };
}

/**
 * Call RC API with fallback: try the primary provider first, fall back to the
 * secondary on failure. Order is env-driven (PRIMARY_PROVIDER / FALLBACK_PROVIDER).
 * Caller reads only `.data`.
 */
async function callRCAPI(
  registrationNumber: string,
  supabase: any,
  vehicleId: string | undefined,
): Promise<{ response?: Response; data: any; provider?: ProviderName; statusCode?: number }> {
  const primary = makeRcProvider(PRIMARY_PROVIDER, registrationNumber);
  const secondary = makeRcProvider(FALLBACK_PROVIDER, registrationNumber);

  console.log(`[RC API] Attempting primary: ${primary.name}`);
  const primaryAttempt = await attemptRc(primary, supabase, vehicleId, registrationNumber, false);

  if (primaryAttempt.ok) {
    console.log(`[RC API] ${primary.name} succeeded, using ${primary.name} response`);
    return {
      response: primaryAttempt.response,
      data: primaryAttempt.result,
      provider: primary.name,
      statusCode: primaryAttempt.statusCode,
    };
  }

  console.log(`[RC API] ${primary.name} failed, falling back to ${secondary.name}`);
  const secondaryAttempt = await attemptRc(secondary, supabase, vehicleId, registrationNumber, true);

  if (secondaryAttempt.threw) {
    // Neither provider returned a usable payload — surface the failure so the
    // handler responds 500 (matches the original re-throw behavior).
    throw primaryAttempt.threw ? primaryAttempt.error : secondaryAttempt.error;
  }

  return {
    response: secondaryAttempt.response,
    data: secondaryAttempt.result,
    provider: secondary.name,
    statusCode: secondaryAttempt.statusCode,
  };
}
function createValidationError(message: string) {
  return {
    success: false,
    type: 'VALIDATION_ERROR',
    message
  };
}

/**
 * Build a provider-agnostic challan strategy. SurePass additionally requires the
 * chassis + engine numbers, so it exposes `canRun()`; QuickEKYC needs only the RC
 * number. This lets the generic runner below work no matter which is primary.
 */
function makeChallanProvider(
  name: ProviderName,
  rcNumber: string,
  chassisNumber: string | undefined,
  engineNumber: string | undefined,
) {
  if (name === 'quickeyc') {
    const config = getQuickEKYCConfig();
    return {
      name,
      label: 'QuickEKYC',
      apiUrl: `${config.baseUrl}${config.challanEndpoint}`,
      payload: prepareQuickEKYCChallanPayload(rcNumber, config.apiKey),
      canRun: () => true,
      call: () => callQuickEKYCChallanAPI(rcNumber),
      isSuccess: (response: Response, data: any) => validateQuickEKYCChallanResponse(data) && response.ok,
      errorMessage: (data: any) => data?.message || 'QuickEKYC API error',
    };
  }
  const config = getSurePareConfig();
  return {
    name,
    label: 'SurePass',
    apiUrl: `${config.baseUrl}${config.challanEndpoint}`,
    payload: prepareSurePareChallanPayload(rcNumber, chassisNumber ?? '', engineNumber ?? ''),
    canRun: () => Boolean(chassisNumber && engineNumber),
    call: () => callSurePareChallanAPI(rcNumber, chassisNumber as string, engineNumber as string),
    isSuccess: (response: Response, data: any) => response.ok && data?.success !== false,
    errorMessage: (data: any) => data?.message || data?.error || 'SurePass API error',
  };
}

/**
 * Call Challan API with fallback: try the primary provider first, fall back to the
 * secondary on failure. Order is env-driven (PRIMARY_PROVIDER / FALLBACK_PROVIDER).
 * The primary + fallback attempts share one process_id so history can link/hide the
 * duplicate when both fail (bothFallback + parent_process_id).
 */
async function callChallanAPI(
  rcNumber: string,
  chassisNumber: string | undefined,
  engineNumber: string | undefined,
  supabase: any,
  vehicleId: string | undefined,
  registrationNumber: string,
): Promise<{ response?: Response; data: any; provider?: ProviderName; statusCode?: number }> {
  // Short process id linking the primary + fallback attempts in history.
  const challanProcessId = generateProcessId();
  const primary = makeChallanProvider(PRIMARY_PROVIDER, rcNumber, chassisNumber, engineNumber);
  const secondary = makeChallanProvider(FALLBACK_PROVIDER, rcNumber, chassisNumber, engineNumber);

  console.log(`[Challan API] Attempting primary: ${primary.name}`);
  let primaryFailed = false;

  // Primary can be skipped only when it needs chassis/engine it doesn't have
  // (SurePass as primary). QuickEKYC always canRun.
  if (primary.canRun()) {
    try {
      const response = await primary.call();
      const data = await response.json();
      const success = primary.isSuccess(response, data);
      const statusCode = response.status || data?.status_code || 500;

      if (success) {
        console.log(`[Challan API] ${primary.name} succeeded`);
        const normalized = normalizeChallanData(data, primary.name);
        await updateVehicleChallans(
          supabase, vehicleId, registrationNumber, primary.name, statusCode, normalized, true, challanProcessId,
        );
        await safeVehicleApiCallLog(supabase, vehicleId, { operation: 'challan', provider: primary.name, isSuccess: true });
        return { response, data: normalized, provider: primary.name, statusCode };
      }

      // Primary HTTP failure -> log and fall through to the secondary.
      primaryFailed = true;
      const errorEntry = createErrorLogEntry(primary.name, statusCode, primary.errorMessage(data), primary.apiUrl, primary.payload);
      await saveErrorLog(supabase, vehicleId, registrationNumber, errorEntry);
      await updateVehicleChallans(
        supabase, vehicleId, registrationNumber, primary.name, statusCode, data, false, challanProcessId,
      );
      await safeVehicleApiCallLog(supabase, vehicleId, { operation: 'challan', provider: primary.name, isSuccess: false });
      console.log(`[Challan API] ${primary.name} failed — falling back to ${secondary.name}`);
    } catch (error) {
      primaryFailed = true;
      const errorMessage = error instanceof Error ? error.message : `${primary.name} exception`;
      const errorEntry = createErrorLogEntry(primary.name, 0, errorMessage, primary.apiUrl, primary.payload);
      await saveErrorLog(supabase, vehicleId, registrationNumber, errorEntry);
      await updateVehicleChallans(
        supabase, vehicleId, registrationNumber, primary.name, 0, { error: errorMessage }, false, challanProcessId,
      );
      await safeVehicleApiCallLog(supabase, vehicleId, { operation: 'challan', provider: primary.name, isSuccess: false });
      console.log(`[Challan API] ${primary.name} exception — falling back to ${secondary.name}`);
    }
  } else {
    console.warn(`[Challan API] primary ${primary.name} cannot run (missing chassis/engine) — falling back to ${secondary.name}`);
  }

  // FALLBACK — secondary provider (only after the primary failed or was skipped).
  if (!secondary.canRun()) {
    console.warn(`[Challan API] missing chassis or engine number — cannot fall back to ${secondary.name}`);
    const validationError = createValidationError(
      `Chassis number and engine number are required to fetch challan details from ${secondary.label}.`,
    );
    await updateVehicleChallans(
      supabase, vehicleId, registrationNumber, secondary.name, 400, validationError, false,
      challanProcessId, challanProcessId, true,
    );
    await safeVehicleApiCallLog(supabase, vehicleId, {
      operation: 'challan', provider: secondary.name, isSuccess: false, isMultiple: true,
    });
    return { data: validationError, statusCode: 400 };
  }

  const response = await secondary.call();
  const data = await response.json();
  const success = secondary.isSuccess(response, data);
  const statusCode = response.status || data?.status_code || 500;

  if (!success) {
    const errorEntry = createErrorLogEntry(secondary.name, statusCode, secondary.errorMessage(data), secondary.apiUrl, secondary.payload);
    await saveErrorLog(supabase, vehicleId, registrationNumber, errorEntry);
  }

  // Normalize to the single canonical challan shape (error payloads pass through).
  const normalized = normalizeChallanData(data, secondary.name);
  // Both providers failed in this flow -> link the fallback entry to the primary so
  // the UI can hide the duplicate.
  const isBothFallbackFailure = primaryFailed && !success;
  await updateVehicleChallans(
    supabase, vehicleId, registrationNumber, secondary.name, statusCode, normalized, success,
    challanProcessId,
    isBothFallbackFailure ? challanProcessId : null,
    isBothFallbackFailure,
  );
  await safeVehicleApiCallLog(supabase, vehicleId, {
    operation: 'challan', provider: secondary.name, isSuccess: success, isMultiple: true,
  });

  return { response, data: normalized, provider: secondary.name, statusCode };
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

console.log(`[vehicle-verify] Provider order — primary: ${PRIMARY_PROVIDER}, fallback: ${FALLBACK_PROVIDER} (PRIMARY_RC='${Deno.env.get('PRIMARY_RC') || ''}')`);

/**
 * Server-side mirror of the UI Document Status check (getDocumentStatus in
 * src/utils/transport-safety/documentStatusUtils.ts). Returns true only when the
 * cached RC data has Insurance / Fitness / PUC dates that are all present, parseable
 * and NOT past-expiry (>= today). Any missing/unparseable/expired field, or missing
 * RC data, returns false so the caller refreshes RC from the providers.
 * "Expiring soon" still counts as up to date (past-expiry only, per requirement).
 */
function computeDocumentStatusUpToDate(currentRcData: any): boolean {
  const data = currentRcData?.data;
  if (!data || typeof data !== 'object') return false;

  const now = new Date();
  // Electric vehicles (VAHAN fuel_type e.g. "PURE EV", "ELECTRIC(BOV)") are exempt from PUC —
  // a missing pucc_upto isn't staleness. Hybrids ("STRONG HYBRID EV") still have an engine
  // and need PUC, so they're excluded even though their fuel_type also contains "EV".
  const fuelTypeValue = typeof data.fuel_type === 'string' ? data.fuel_type.toUpperCase() : '';
  const isElectric = !fuelTypeValue.includes('HYBRID') &&
    (fuelTypeValue.includes('ELECTRIC') || fuelTypeValue.includes('BOV') || /\bEV\b/.test(fuelTypeValue));
  const fields = isElectric
    ? [data.insurance_upto, data.fit_up_to]
    : [data.insurance_upto, data.fit_up_to, data.pucc_upto];

  for (const value of fields) {
    if (!value) return false;
    const expiry = new Date(value);
    if (Number.isNaN(expiry.getTime())) return false;
    if (expiry < now) return false;
  }
  return true;
}

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

    // Load the cached RC row (if we have a vehicleId) so we can decide whether the
    // documents are already up to date and skip the paid RC lookup.
    let cachedRcData: any = null;
    let cachedVerificationData: any = null;
    if (vehicleId) {
      const { data: cachedRow, error: cachedRowError } = await supabase
        .from('vehicles')
        .select('current_rc_data, verification_data')
        .eq('id', vehicleId)
        .maybeSingle();
      if (cachedRowError) {
        console.error('Failed to read cached RC data:', cachedRowError);
      } else {
        cachedRcData = cachedRow?.current_rc_data ?? null;
        cachedVerificationData = cachedRow?.verification_data ?? null;
      }
    }

    // Documents are "up to date" only when the cached RC Insurance/Fitness/PUC dates
    // are all present and not past-expiry. When true we reuse the cached RC and skip
    // the RC API (both providers); challan is always refreshed below.
    const documentStatusUpToDate = computeDocumentStatusUpToDate(cachedRcData);

    let providerData: any;
    if (documentStatusUpToDate) {
      console.log('[RC API] Documents up to date — skipping RC API, reusing cached current_rc_data');
      providerData = cachedRcData;
    } else {
      // Call RC API with fallback: QuickEKYC primary, SurePass secondary if error
      const rcResult = await callRCAPI(registrationNumber, supabase, vehicleId);
      providerData = rcResult.data;
    }

    // Note: Even if RC API fails, we continue to store the error in history
    // The vehicles table RC fields are already updated in callRCAPI function

    // Extract required data for challan API call
    let challanData: any = null;
    if (providerData.data) {
      const data = providerData.data;
      const rcNumber = registrationNumber;

      // SurePass challan requires REAL (unmasked) chassis + engine numbers. A masked value
      // is still a non-empty string, so we must not pass it through — resolve the real
      // values with priority:
      //   1) the dedicated vehicles columns (previously unmasked & stored), looked up by
      //      registration number;
      //   2) the current RC response, but only when it is NOT masked. `masked_* === true`
      //      means masked (skip); `false` or absent (legacy/non-masked providers like
      //      QuickEKYC) means the value is real and usable.
      // When neither source yields a real value, chassis/engine stay undefined so the
      // SurePass challan provider's canRun() returns false and we fall back to QuickEKYC.
      const rcMetadata = data.response_metadata;
      let chassisNumber: string | undefined;
      let engineNumber: string | undefined;

      const { data: storedVehicleNumbers, error: storedNumbersError } = await supabase
        .from('vehicles')
        .select('vehicle_chasi_number, vehicle_engine_number')
        .eq('registration_number', rcNumber)
        .maybeSingle();
      if (storedNumbersError) {
        console.warn('Could not read stored chassis/engine columns:', storedNumbersError);
      }
      if (storedVehicleNumbers?.vehicle_chasi_number) {
        chassisNumber = storedVehicleNumbers.vehicle_chasi_number;
      }
      if (storedVehicleNumbers?.vehicle_engine_number) {
        engineNumber = storedVehicleNumbers.vehicle_engine_number;
      }

      if (!chassisNumber && data.vehicle_chasi_number && rcMetadata?.masked_chassis !== true) {
        chassisNumber = data.vehicle_chasi_number;
      }
      if (!engineNumber && data.vehicle_engine_number && rcMetadata?.masked_engine !== true) {
        engineNumber = data.vehicle_engine_number;
      }

      console.log(`Got vehicle data - RC: ${rcNumber}, Chassis: ${chassisNumber}, Engine: ${engineNumber} (challan uses unmasked values only; SurePass falls back to QuickEKYC when absent)`);
      
      // Check if we have all required parameters for challan call
      // For QuickEKYC, only rcNumber is needed; for SurePass, all three are required
      // Since QuickEKYC is primary, we can always attempt it with just rcNumber;
      // the SurePass fallback will validate chassis/engine itself if needed
      const canCallChallan = rcNumber && (chassisNumber && engineNumber || true); // Can always try (QuickEKYC needs only rcNumber, SurePass fallback needs all)
      
      if (canCallChallan) {
        try {
          // Call Challan API with fallback: QuickEKYC primary, SurePass secondary if error
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
    const rcFailed = providerData?.status_code !== 200 && providerData?.status_code !== undefined;
    if (rcFailed || !providerData?.data) {
      verificationStatus = 'failed';
    } else if (providerData.success === false) {
      verificationStatus = 'incomplete';
    } else if (providerData.data?.rc_status) {
      // Use RC status from response if available
      verificationStatus = providerData.data.rc_status.toLowerCase();
    }

    // On the skip path (documents up to date) we reuse the cached verification_data
    // and perform NO RC-derived writes — only the challan refresh above ran.
    // Default to [] (never null) so downstream consumers always get an array.
    let completeTransformedData: any = cachedVerificationData ?? [];

    if (!documentStatusUpToDate) {
    // Get existing vehicle data first if we have a vehicleId
    let existingVerificationLog = {};
    let savedVehicleTypeId: string | null = null;
    let savedVehicleTypeName: string | null = null;
    
    if (vehicleId) {
      const { data: vehicleData, error } = await supabase
        .from('vehicles')
        .select('verification_data, type')
        .eq('id', vehicleId)
        .single();

      if (!error && vehicleData) {
        savedVehicleTypeId = vehicleData.type || null;

        if (Array.isArray(vehicleData.verification_data)) {
          // Find the verification_log entry
          const logEntry = vehicleData.verification_data.find(item => item.field === 'verification_log');
          if (logEntry && logEntry.value) {
            existingVerificationLog = logEntry.value;
          }
        }
        
        // Note: rc_history_log is no longer stored in verification_data
        // RC history can be accessed from vehicles.current_rc_data if needed
        
        console.log("Found existing verification data with log entry");
      }
      if (savedVehicleTypeId) {
        const { data: vehicleTypeData, error: vehicleTypeError } = await supabase
          .from('vehicle_type')
          .select('name')
          .eq('id', savedVehicleTypeId)
          .maybeSingle();

        if (vehicleTypeError) {
          console.error('Error fetching saved vehicle type for safety check log:', vehicleTypeError);
        }

        savedVehicleTypeName = vehicleTypeData?.name || savedVehicleTypeId;
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

    if (savedVehicleTypeName) {
      currentVerificationData.push({
        field: 'vehicle_type',
        value: savedVehicleTypeName,
        verified: true
      });
    }
    
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

          // Auto-fill the dedicated chassis/engine columns only when the provider confirms
          // the value is NOT masked. Never overwrite a good value with a masked one.
          const responseMetadata = data.response_metadata;
          if (responseMetadata && typeof responseMetadata === 'object') {
            if (responseMetadata.masked_chassis === false && data.vehicle_chasi_number) {
              updates.vehicle_chasi_number = data.vehicle_chasi_number;
            }
            if (responseMetadata.masked_engine === false && data.vehicle_engine_number) {
              updates.vehicle_engine_number = data.vehicle_engine_number;
            }
            if (responseMetadata.masked_owner_name === false && data.owner_name) {
              updates.vehicle_owner_name = data.owner_name;
            }
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
    completeTransformedData = [verificationLogEntry];
    
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
    } else if (vehicleId) {
      // Skip path: documents are up to date, so we did NOT call the RC API and must
      // not touch current_rc_data / verification_data. But a safety check DID run
      // (challan was refreshed), so advance the timestamp/status only — otherwise the
      // "last checked" date would revert to its previous value on the next page load.
      const { error: skipUpdateError } = await supabase
        .from('vehicles')
        .update({
          verification_status: verificationStatus,
          verification_date: verificationDate
        })
        .eq('id', vehicleId);

      if (skipUpdateError) {
        console.error('Error updating verification timestamp on skip:', skipUpdateError);
      } else {
        console.log('Verification timestamp advanced on skip (RC data untouched)');
      }
    } // end if (!documentStatusUpToDate) — RC data writes skipped when documents are up to date

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          original: providerData,
          challan: challanData,
          transformed: completeTransformedData,
          status: verificationStatus,
          verificationDate: verificationDate,
          document_status_up_to_date: documentStatusUpToDate
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
