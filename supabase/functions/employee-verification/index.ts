
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import { logVerificationError, logVerificationSuccess } from "../_shared/verificationAuditlog.ts";

// CORS headers setup
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Integration selector
const integrationName = (Deno.env.get('ENABLE_API_INTEGRATION_NAME') || '').toLowerCase();
const isQuickEKYC = integrationName === 'quickekyc';

// OTP validity period: Read from environment variable (in minutes), default to 10 minutes
const getOtpValidityMinutes = (): number => {
  const validity = Deno.env.get('AADHAR_OTP_VALIDITY');
  return validity ? parseInt(validity, 10) : 10;
};

// ============================================================================
// QuickEKYC Functions
// ============================================================================

/**
 * Get QuickEKYC configuration
 */
function getQuickEKYCConfig() {
  return {
    apiKey: Deno.env.get("QUICKEKYC_API_KEY_PROD") || '',
    baseUrl: Deno.env.get("QUICKEKYC_BASE_ENDPOINT") || '',
    generateOtpEndpoint: "/api/v1/aadhaar-v2/generate-otp",
    submitOtpEndpoint: "/api/v1/aadhaar-v2/submit-otp"
  };
}

/**
 * Prepare QuickEKYC Request OTP payload
 */
function prepareQuickEKYCRequestOtpPayload(documentNumber: string, apiKey: string) {
  return {
    id_number: documentNumber,
    key: apiKey
  };
}

/**
 * Parse QuickEKYC request_id into a number.
 * QuickEKYC verify-otp API expects request_id as numeric type.
 */
function parseQuickEKYCRequestId(requestId?: string | number | null): number | undefined {
  if (requestId === null || requestId === undefined) return undefined;
  if (typeof requestId === 'number' && Number.isFinite(requestId)) return requestId;
  if (typeof requestId === 'string') {
    const trimmed = requestId.trim();
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }
  }
  return undefined;
}

/**
 * Prepare QuickEKYC Request OTP headers
 */
function prepareQuickEKYCRequestOtpHeaders() {
  return {
    'Content-Type': 'application/json'
  };
}

/**
 * Call QuickEKYC Request OTP API
 */
async function callQuickEKYCRequestOtpAPI(documentNumber: string) {
  const config = getQuickEKYCConfig();
  const url = `${config.baseUrl}${config.generateOtpEndpoint}`;
  const headers = prepareQuickEKYCRequestOtpHeaders();
  const body = prepareQuickEKYCRequestOtpPayload(documentNumber, config.apiKey);
  
  console.log(`[QuickEKYC] Making Request OTP API call to: ${url}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  
  return response;
}

/**
 * Prepare QuickEKYC Verify OTP payload
 */
function prepareQuickEKYCVerifyOtpPayload(otp: string, apiKey: string, client_id?: string) {
  const payload: any = {
    otp,
    key: apiKey
  };
  
  if (client_id) {
    payload.request_id = client_id;
  }
  
  return payload;
}

/**
 * Prepare QuickEKYC Verify OTP headers
 */
function prepareQuickEKYCVerifyOtpHeaders() {
  return {
    'Content-Type': 'application/json'
  };
}

/**
 * Call QuickEKYC Verify OTP API
 */
async function callQuickEKYCVerifyOtpAPI(otp: string, client_id?: string) {
  const config = getQuickEKYCConfig();
  const url = `${config.baseUrl}${config.submitOtpEndpoint}`;
  const headers = prepareQuickEKYCVerifyOtpHeaders();
  const body = prepareQuickEKYCVerifyOtpPayload(otp, config.apiKey, client_id);
  
  console.log(`[QuickEKYC] Making Verify OTP API call to: ${url}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  
  return response;
}

// ============================================================================
// SurePare Functions
// ============================================================================

/**
 * Get SurePare configuration
 */
function getSurePareConfig() {
  return {
    apiKey: Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || '',
    baseUrl: Deno.env.get("SUREPASS_PRODUCTION_BASE_URL") || '',
    generateOtpEndpoint: "/api/v1/aadhaar-v2/generate-otp",
    submitOtpEndpoint: "/api/v1/aadhaar-v2/submit-otp"
  };
}

/**
 * Prepare SurePare Request OTP payload
 */
function prepareSurePareRequestOtpPayload(documentNumber: string) {
  return {
    id_number: documentNumber
  };
}

/**
 * Prepare SurePare Request OTP headers
 */
function prepareSurePareRequestOtpHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
}

/**
 * Call SurePare Request OTP API
 */
async function callSurePareRequestOtpAPI(documentNumber: string) {
  const config = getSurePareConfig();
  const url = `${config.baseUrl}${config.generateOtpEndpoint}`;
  const headers = prepareSurePareRequestOtpHeaders(config.apiKey);
  const body = prepareSurePareRequestOtpPayload(documentNumber);
  
  console.log(`[SurePare] Making Request OTP API call to: ${url}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  
  return response;
}

/**
 * Prepare SurePare Verify OTP payload
 */
function prepareSurePareVerifyOtpPayload(otp: string, txnId?: string, client_id?: string) {
  const payload: any = {
    otp
  };
  
  if (txnId) {
    payload.txn_id = txnId;
  }
  
  if (client_id) {
    payload.client_id = client_id;
  }
  
  return payload;
}

/**
 * Prepare SurePare Verify OTP headers
 */
function prepareSurePareVerifyOtpHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
}

/**
 * Call SurePare Verify OTP API
 */
async function callSurePareVerifyOtpAPI(otp: string, txnId?: string, client_id?: string) {
  const config = getSurePareConfig();
  const url = `${config.baseUrl}${config.submitOtpEndpoint}`;
  const headers = prepareSurePareVerifyOtpHeaders(config.apiKey);
  const body = prepareSurePareVerifyOtpPayload(otp, txnId, client_id);
  
  console.log(`[SurePare] Making Verify OTP API call to: ${url}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  
  return response;
}

// ============================================================================
// Main Handler Functions with Fallback Logic
// ============================================================================

/**
 * Request Aadhar OTP with fallback: Try QuickEKYC first, fallback to SurePare if status_code = 500
 * Returns response with 'api' key indicating which integration was used
 */
async function requestAadharOtpWithFallback(
  supabase: any,
  documentNumber: string,
  employeeId: string,
  documentId: string,
  documentTypeId?: string | null
): Promise<{ response: Response; data: any; api: string }> {
  // Primary: Always try QuickEKYC first
  console.log('[Request OTP] Attempting primary: QuickEKYC');
  const quickEKYResponse = await callQuickEKYCRequestOtpAPI(documentNumber);
  
  // Clone the response to read JSON without consuming the original
  const quickEKYResponseClone = quickEKYResponse.clone();
  const quickEKYData = await quickEKYResponseClone.json();
  
  // Check if QuickEKYC returned status_code 500
  if (quickEKYData?.status_code === 500) {
    await logVerificationError(supabase, {
      employeeId,
      documentId,
      provider: 'quickekyc',
      statusCode: 500,
      message: quickEKYData.message,
      response: quickEKYData,
      documentTypeId: documentTypeId ?? undefined,
      documentTypeName: 'AADHAAR',
      documentNumber: documentNumber
    });

    // Invalid Aadhaar Number is a validation error: return immediately, do not fallback
    const message = (quickEKYData?.message ?? '').toString().toLowerCase();
    const isInvalidAadhaar =
      message.includes('invalid aadhaar') ||
      message.includes('invalid aadhar') ||
      (message.includes('aadhaar number') && message.includes('invalid'));
    if (isInvalidAadhaar) {
      console.log('[Request OTP] Primary returned Invalid Aadhaar Number, returning without fallback');
      return { response: quickEKYResponse, data: quickEKYData, api: 'quickekyc' };
    }

    console.log('[Request OTP] QuickEKYC returned status_code 500, falling back to SurePare');
    // Secondary: Fallback to SurePare
    const surePareResponse = await callSurePareRequestOtpAPI(documentNumber);
    const surePareData = await surePareResponse.json();
    console.log('data for the surepare',surePareData);

    if (surePareData?.status_code === 200) {
      await logVerificationSuccess(supabase, {
        employeeId,
        documentId,
        provider: 'surepass',
        statusCode: 200,
        response: surePareData,
        documentTypeId: documentTypeId ?? undefined,
        documentTypeName: 'AADHAAR',
        documentNumber: documentNumber
      });
    }
    if (surePareData?.status_code === 500 || surePareData?.success === false) {
      await logVerificationError(supabase, {
        employeeId,
        documentId,
        provider: 'surepass',
        statusCode: surePareData?.status_code,
        message: surePareData.message,
        response: surePareData,
        bothFallback: surePareData?.success === false,
        documentTypeId: documentTypeId ?? undefined,
        documentTypeName: 'AADHAAR',
        documentNumber: documentNumber
      });
    }
    return { response: surePareResponse, data: surePareData, api: 'surepare' };
  }
   await logVerificationSuccess(supabase, {
     employeeId,
     documentId,
     provider: 'quickekyc',
     statusCode: 200,
     response: quickEKYData,
     documentTypeId: documentTypeId ?? undefined,
     documentTypeName: 'AADHAAR',
     documentNumber: documentNumber
   });
  
  // QuickEKYC succeeded, return its response with api indicator
  console.log('[Request OTP] QuickEKYC succeeded, using QuickEKYC response');
  return { response: quickEKYResponse, data: quickEKYData, api: 'quickekyc' };
}

/**
 * Verify Aadhar OTP using the specified integration
 */
async function verifyAadharOtpWithIntegration(otp: string, api: string, txnId?: string, client_id?: string): Promise<{ response: Response; data: any }> {
  if (api === 'quickekyc') {
    console.log('[Verify OTP] Using QuickEKYC integration');
    const response = await callQuickEKYCVerifyOtpAPI(otp, client_id);
    const data = await response.json();
    return { response, data };
  } else {
    console.log('[Verify OTP] Using SurePare integration');
    const response = await callSurePareVerifyOtpAPI(otp, txnId, client_id);
    const data = await response.json();
    return { response, data };
  }
}

// Helper function to generate UUID
function generateUUID(): string {
  // Generate UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to normalize QuickEKYC response to Surepass format
function normalizeQuickEKYCResponse(response: any, isOtpRequest: boolean): any {
  if (isOtpRequest) {
    // Normalize OTP request response
    if (response.status_code === 200 && response.status === 'success') {
      const generatedTxnId = generateUUID();
      const clientId = response.request_id?.toString() || null;
      return {
        success: true,
        message: response.message || "OTP sent successfully",
        data: {
          txn_id: generatedTxnId,
          client_id: clientId
        },
        txn_id: generatedTxnId,
        client_id: clientId
      };
    } else {
      // Error response
      return {
        success: false,
        message: response.message || "Verification failed",
        status_code: response.status_code,
        data: response.data || {}
      };
    }
  } else {
    // Normalize OTP verification response
    if (response.status_code === 200 && response.status === 'success') {
      // QuickEKYC response structure matches Surepass, so return as-is but ensure success flag
      return {
        success: true,
        status_code: 200,
        message: response.message || "Aadhar OTP verified. Awaiting approval.",
        data: response.data || {}
      };
    } else {
      // Error response - check for special cases
      // Handle case where status_code is 200 but status is 'error'
      if (response.status_code === 200 && response.status === 'error') {
        return {
          success: false,
          status_code: 200,
          message: response.message || "Invalid request",
          data: response.data || {}
        };
      }
      // Handle timeout/verification failed cases
      return {
        success: false,
        status_code: response.status_code,
        message: response.message || "Verification failed",
        data: response.data || {}
      };
    }
  }
}

// Helper function to return server-side error messages
// Returns the actual API error message for both first API (request OTP) and second API (verify OTP)
const getUserFriendlyErrorMessage = (apiResponse: any, statusCode: number | undefined, isQuickEKYCProvider: boolean = false): string => {
  // Return the actual server-side error message if available
  if (apiResponse?.message) {
    return apiResponse.message;
  }
  
  // Fallback to generic messages only if no message is available
  if (statusCode === 429) {
    return 'Too many requests. Please wait a moment and try again';
  }
  
  if (statusCode === 401) {
    return 'Authentication failed. Please try again';
  }
  
  if (statusCode === 403) {
    return 'Access denied. Please contact support';
  }
  
  if (statusCode === 404) {
    return 'Service not found. Please contact support';
  }
  
  if (statusCode && statusCode >= 500) {
    return 'Service temporarily unavailable. Please try again later';
  }
  
  // Default fallback for any other errors
  return 'Verification failed. Please check your details and try again';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }
  
  try {
    const requestBody = await req.json();
    const { 
      action,
      documentId, 
      documentNumber, 
      otp, 
      txnId,
      client_id,
      verification_notes,
      reject_reason,
      verified_by_employee_id
    } = requestBody;
    
    console.log(`Received ${action} request`, { 
      documentId, 
      hasDocNumber: !!documentNumber, 
      hasTxnId: !!txnId, 
      hasOtp: !!otp,
      hasClientId: !!client_id,
      hasVerificationNotes: !!verification_notes,
      documentNumber,
      requestBody
    });
    let currentProvider: 'quickekyc' | 'surepass' | 'unknown' = 'unknown';
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, fetch document status IDs for governance, manual and rejected statuses
    console.log("Fetching document status IDs");
    
    const { data: governanceStatus, error: governanceError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'governance')
      .single();
    
    if (governanceError) {
      console.error("Error fetching governance status:", governanceError);
      return new Response(
        JSON.stringify({ error: "Could not find governance status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { data: manualStatus, error: manualError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'manual')
      .single();
    
    if (manualError) {
      console.error("Error fetching manual status:", manualError);
      return new Response(
        JSON.stringify({ error: "Could not find manual status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { data: rejectedStatus, error: rejectedError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'rejected')
      .single();
    
    if (rejectedError) {
      console.error("Error fetching rejected status:", rejectedError);
      return new Response(
        JSON.stringify({ error: "Could not find rejected status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: inProgressStatus, error: inProgressError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'in-progress')
      .single();

    if (inProgressError) {
      console.error("Error fetching in-progress status:", inProgressError);
      return new Response(
        JSON.stringify({ error: "Could not find in-progress status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const governanceStatusId = governanceStatus?.id;
    const manualStatusId = manualStatus?.id;
    const rejectedStatusId = rejectedStatus?.id;
    const inProgressStatusId = inProgressStatus?.id;
    
    console.log("Found status IDs:", {
      governance: governanceStatusId,
      manual: manualStatusId,
      rejected: rejectedStatusId
    });
    
    // Handle manual verification
    if (action === 'manualVerify') {
      if (!documentId) {
        console.error("Missing required field: documentId for manual verification");
        return new Response(
          JSON.stringify({ error: "Document ID is required for manual verification" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        console.log(`Processing manual verification for document ID: ${documentId}`);
        
        // First fetch the current logs
        const { data: document, error: fetchError } = await supabase
          .from('employee_documents')
          .select('employee_docs_log, employee_id')
          .eq('id', documentId)
          .single();
          
        if (fetchError) {
          console.error("Error fetching document for manual verification:", fetchError);
          return new Response(
            JSON.stringify({ error: "Failed to fetch document data" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Get existing logs or initialize empty array
        const existingLogs = document?.employee_docs_log || [];
        const employeeId = document?.employee_id;
        
        if (!employeeId) {
          console.error("Document does not have an associated employee ID");
          return new Response(
            JSON.stringify({ error: "Document does not have an associated employee ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Create log entry with timestamp
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "manual_verification",
          response: {
            status: "verified",
            notes: verification_notes || "Document manually verified by staff."
          }
        };
        
        console.log("Updating document with manual verification status and log entry");
        console.log("Using manual status ID:", manualStatusId);
        
        // Update document with verification status, log entry, and manual status ID
        const { data: updateData, error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'verified',
            employee_docs_log: [...existingLogs, logEntry],
            document_status_id: manualStatusId, // Use manual status ID
            verified_by: verified_by_employee_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId)
          .select();
          
        if (updateError) {
          console.error("Error updating document with manual verification:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update document with verification data" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log("Manual verification successful. Updated document:", updateData);
        
        // Check if all documents are verified for this employee
        const { data: employeeDocs, error: docsError } = await supabase
          .from('employee_documents')
          .select('verification_status')
          .eq('employee_id', employeeId);
        
        if (docsError) {
          console.error("Error fetching employee documents:", docsError);
        } else {
          const allVerified = employeeDocs?.every(doc => doc.verification_status === 'verified');
          
          if (allVerified) {
            console.log("All documents verified for employee:", employeeId);
            console.log("Updating employee status to true");
            
            const { error: employeeError } = await supabase
              .from('employees')
              .update({ status: true })
              .eq('id', employeeId);
              
            if (employeeError) {
              console.error("Error updating employee status:", employeeError);
            } else {
              console.log("Employee status updated to verified");
            }
          }
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Document manually verified successfully",
            status: "verified",
            documentId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
        
      } catch (err) {
        console.error("Exception in manual verification:", err);
        return new Response(
          JSON.stringify({ error: "Internal server error during manual verification" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Approve after API verification (Aadhaar flow)
    if (action === 'approveAfterApi') {
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: "Document ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!verified_by_employee_id) {
        return new Response(
          JSON.stringify({ error: "Employee ID is required for approval" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      try {
        // Fetch current logs
        const { data: document } = await supabase
          .from('employee_documents')
          .select('employee_docs_log')
          .eq('id', documentId)
          .single();
        const existingLogs = document?.employee_docs_log || [];

        const logEntry = {
          timestamp: new Date().toISOString(),
          action: 'approve_after_api',
          notes: verification_notes || 'Approved after Aadhaar API check',
          verified_by: verified_by_employee_id
        };

        await supabase
          .from('employee_documents')
          .update({
            verification_status: 'verified',
            document_status_id: governanceStatusId,
            verified_by: verified_by_employee_id,
            employee_docs_log: [...existingLogs, logEntry],
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to approve document' }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Handle Aadhar OTP request
    if (action === 'requestAadharOtp') {
      // Check if document has had an OTP generated recently
      const { data: document, error: docError } = await supabase
        .from('employee_documents')
        .select('last_otp_generated, employee_id')
        .eq('id', documentId)
        .single();
      const employeeId = document.employee_id;
      let currentProvider: 'quickekyc' | 'surepass' = 'quickekyc';
      if (documentId) {
        if (docError) {
          console.error("Error fetching document:", docError);
        } else if (document?.last_otp_generated) {
          const lastOtpTime = new Date(document.last_otp_generated);
          const currentTime = new Date();
          // Calculate time difference in minutes
          const timeDiffMinutes = (currentTime.getTime() - lastOtpTime.getTime()) / (1000 * 60);
          console.log("Current time:", currentTime.toISOString());
          console.log("Last OTP time:", lastOtpTime.toISOString());
          console.log("Time difference since last OTP (minutes):", timeDiffMinutes);
          
          // OTP validity period: Read from environment variable (in minutes), default to 10 minutes
          const OTP_VALIDITY_MINUTES = getOtpValidityMinutes();
          
          // If it's been less than the validity period, OTP is still valid
          if (timeDiffMinutes < OTP_VALIDITY_MINUTES) {
            // Calculate remaining validity time in seconds
            const remainingSeconds = Math.ceil((OTP_VALIDITY_MINUTES - timeDiffMinutes) * 60);
            console.log(`OTP still valid. ${remainingSeconds} seconds remaining for use.`);
            
            let clientIdForResponse: string | undefined = undefined;
            if (document?.employee_id) {
              const { data: employee } = await supabase
                .from('employees')
                .select('client_id')
                .eq('id', document.employee_id)
                .single();
              if (employee?.client_id) {
                clientIdForResponse = employee.client_id;
              }
            }

            // Return success response with otpStatus to indicate OTP input should be shown
            return new Response(
              JSON.stringify({ 
                success: true,
                message: "OTP already sent and still valid. Please enter the OTP.",
                cooldownRemaining: remainingSeconds,
                otpStatus: "valid",
                showOtpInput: true,
                client_id: clientIdForResponse // Include client_id for verifyAadharOtp
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            console.log("Previous OTP has expired, allowing new OTP request");
          }
        }
      }
      
      try {
        if (!documentNumber) {
          return new Response(
            JSON.stringify({ error: "Document number is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data: doc } = await supabase
          .from('employee_documents')
          .select('employee_id, document_type_id')
          .eq('id', documentId)
          .single();

        const employeeId = doc?.employee_id;
        const documentTypeId = doc?.document_type_id;
        // Call with fallback: QuickEKYC primary, SurePare secondary if status_code = 500
        const { response: apiResponse, data: rawData, api: usedApi } = await requestAadharOtpWithFallback(supabase, documentNumber, employeeId, documentId, documentTypeId);
        
        console.log(`${usedApi === 'quickekyc' ? 'QuickEKYC' : 'SurePare'} API response:`, JSON.stringify(rawData));
        currentProvider = usedApi === 'quickekyc' ? 'quickekyc' : 'surepass';

        // Normalize QuickEKYC response to Surepass format
        const isQuickEKYCUsed = usedApi === 'quickekyc';
        const data = isQuickEKYCUsed ? normalizeQuickEKYCResponse(rawData, true) : rawData;
        
        // Handle API success case
        if (data.success) {
          // Update document with timestamp of OTP generation
          if (documentId) {
            await supabase
              .from('employee_documents')
              .update({ last_otp_generated: new Date().toISOString() })
              .eq('id', documentId);
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: data.message || "OTP sent successfully", 
              txnId: data.data?.txn_id || data.txn_id,
              client_id: data.data?.client_id || data.client_id,
              api: usedApi // Add api key to indicate which integration was used
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // Log the technical error for debugging
          console.error(`${usedApi === 'quickekyc' ? 'QuickEKYC' : 'SurePare'} API error:`, rawData);

          const statusCode = rawData?.status_code ?? apiResponse?.status;
          const isSensitiveStatusCode = statusCode === 429 || statusCode === 401 || statusCode === 403 || statusCode === 404;
          const apiMessage = (rawData?.message ?? '').toString().toLowerCase();
          const isInvalidAadhaarMessage = apiMessage.includes('invalid aadhaar') || apiMessage.includes('invalid aadhar');
          const IN_PROGRESS_MSG = "Your verification request is being processed. In some cases, additional checks are required to ensure accuracy and compliance.";
          const INVALID_AADHAAR_MSG = "The Aadhaar number you entered is invalid. Please check and try again.";
          let userFriendlyMessage = getUserFriendlyErrorMessage(rawData, apiResponse?.status, isQuickEKYCUsed);
          let error_key: string | undefined;

          if (isInvalidAadhaarMessage) {
            userFriendlyMessage = INVALID_AADHAAR_MSG;
          } else if (!isSensitiveStatusCode && documentId) {
            userFriendlyMessage = IN_PROGRESS_MSG;
            error_key = "in-progress";
            const { data: docForLog } = await supabase
              .from('employee_documents')
              .select('employee_docs_log')
              .eq('id', documentId)
              .single();
            const existingLogs = docForLog?.employee_docs_log || [];
            const logEntry = {
              timestamp: new Date().toISOString(),
              action: "request_aadhar_otp_failed",
              response: rawData
            };
            await supabase
              .from('employee_documents')
              .update({
                employee_docs_log: [...existingLogs, logEntry],
                verification_status: 'in-progress',
                document_status_id: inProgressStatusId,
                api_verification_status: 'failed',
                api_verification_method: 'api',
                api_verification_date: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', documentId);
          }

          const hasErrorStatusCode = rawData.status_code && rawData.status_code !== 200;
          return new Response(
            JSON.stringify({
              success: false,
              error: userFriendlyMessage,
              status_code: hasErrorStatusCode ? rawData.status_code : undefined,
              ...(error_key !== undefined && { error_key })
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        await logVerificationError(supabase, {
          employeeId,
          documentId,
          provider: currentProvider, 
          statusCode: 500,
          message:
            error instanceof Error
              ? error.message
              : 'OTP verification failed due to unexpected error',
          response: {
            error: String(error)
          },
          documentTypeId: doc?.document_type_id ?? undefined,
          documentTypeName: 'AADHAAR',
          documentNumber: documentNumber
        });
        console.error(`Error calling API:`, error);
        return new Response(
          JSON.stringify({ success: false, error: "Unable to connect to verification service. Please try again later" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Handle Aadhar OTP verification
    else if (action === 'verifyAadharOtp') {
      const { data: document } = await supabase
          .from('employee_documents')
          .select('employee_id, document_type_id')
          .eq('id', documentId)
          .single();

      const employeeId = document.employee_id;
      const documentTypeId = document?.document_type_id;
      // Only require OTP - txnId is now optional
      if (!otp) {
        console.error("Missing required field: OTP");
        return new Response(
          JSON.stringify({ error: "OTP is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Validate client_id/request_id type for QuickEKYC if provided by frontend.
      let clientIdForVerification = client_id;
      if (clientIdForVerification) {
        const parsedRequestId = parseQuickEKYCRequestId(clientIdForVerification);
        if (parsedRequestId === undefined) {
          clientIdForVerification = undefined;
        } else {
          clientIdForVerification = String(parsedRequestId);
        }
      }
      
      // Get the 'api' key from request body to determine which integration to use
      // This should match the 'api' key returned from requestAadharOtp
      const requestApi = requestBody.api;
      const useApi = requestApi === 'surepare' ? 'surepare' : 'quickekyc';
      currentProvider = useApi === 'quickekyc' ? 'quickekyc' : 'surepass';
      try {
        // Call verify OTP using the integration specified by the 'api' key from first call
        const { response: apiResponse, data: rawData } = await verifyAadharOtpWithIntegration(otp, useApi, txnId, clientIdForVerification);
        
        console.log(`${useApi === 'quickekyc' ? 'QuickEKYC' : 'SurePare'} API verification response:`, JSON.stringify(rawData));
        
        // Normalize QuickEKYC response to Surepass format
        const isQuickEKYCUsed = useApi === 'quickekyc';
        const data = isQuickEKYCUsed ? normalizeQuickEKYCResponse(rawData, false) : rawData;
        
        // Check status_code in API response
        if (data.success && data.status_code === 200) {
          // Persist API response meta for faster UI rendering; do NOT auto-approve
          if (documentId) {
            const { data: document } = await supabase
              .from('employee_documents')
              .select('employee_docs_log')
              .eq('id', documentId)
              .single();
            const existingLogs = document?.employee_docs_log || [];
            const logEntry = {
              timestamp: new Date().toISOString(),
              action: "verify_aadhar_otp",
              response: data
            };
            await logVerificationSuccess(supabase, {
              employeeId: employeeId,
              documentId,
              provider: useApi === 'quickekyc' ? 'quickekyc' : 'surepass',
              statusCode: 200,
              response: data,
              documentTypeId: documentTypeId ?? undefined,
              documentTypeName: 'AADHAAR',
              documentNumber: documentNumber
            });

            // Extract personal_info from API response data
            const apiData = data?.data || {};
            let personalInfo: { dob?: string; address?: string } | null = null;
            
            // Extract dob and address if available
            if (apiData.dob || apiData.address) {
              personalInfo = {};
              
              // Format and store dob in YYYY-MM-DD format
              if (apiData.dob) {
                const dobStr = String(apiData.dob).trim();
                
                // Check if already in YYYY-MM-DD format (most common case)
                if (/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) {
                  personalInfo.dob = dobStr;
                } else {
                  // Try to parse and format the date if in different format
                  const dobDate = new Date(dobStr);
                  if (!isNaN(dobDate.getTime())) {
                    const year = dobDate.getFullYear();
                    const month = String(dobDate.getMonth() + 1).padStart(2, '0');
                    const day = String(dobDate.getDate()).padStart(2, '0');
                    personalInfo.dob = `${year}-${month}-${day}`;
                  } else {
                    // If parsing fails, log warning but don't store invalid date
                    console.warn('Invalid date format for dob:', dobStr);
                  }
                }
              }
              
              // Concatenate address object into readable format
              if (apiData.address && typeof apiData.address === 'object') {
                const addr = apiData.address;
                const addressParts: string[] = [];
                
                // Build address in logical order: house, street, landmark, po, vtc, subdist, dist, state, zip, country
                if (addr.house) addressParts.push(addr.house);
                if (addr.street) addressParts.push(addr.street);
                if (addr.landmark) addressParts.push(addr.landmark);
                if (addr.loc) addressParts.push(addr.loc);
                if (addr.po) addressParts.push(addr.po);
                if (addr.vtc) addressParts.push(addr.vtc);
                if (addr.subdist && addr.subdist !== addr.vtc) addressParts.push(addr.subdist);
                if (addr.dist) addressParts.push(addr.dist);
                if (addr.state) addressParts.push(addr.state);
                // Zip is at top level of apiData, not in address object
                if (apiData.zip) addressParts.push(apiData.zip);
                if (addr.country) addressParts.push(addr.country);
                
                // Join with comma and space, filter out empty strings
                personalInfo.address = addressParts.filter(part => part && part.trim()).join(', ');
              }
            }
            
            const updateData: any = {
              employee_docs_log: [...existingLogs, logEntry],
              api_response_data: data,
              api_verification_status: 'completed',
              api_verification_method: 'api',
              api_verification_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_otp_generated: null // Clear OTP timestamp after successful verification
            };
            
            // Add personal_info if we extracted it
            if (personalInfo) {
              updateData.personal_info = personalInfo;
            }
            
            await supabase
              .from('employee_documents')
              .update(updateData)
              .eq('id', documentId);
          }
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Aadhar OTP verified. Awaiting approval.",
              data
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // Failed verification - log the failure but don't set rejected status
          // API failures should not automatically set the document to rejected status
          if (documentId) {
            // Fetch current logs
            const { data: document } = await supabase
              .from('employee_documents')
              .select('employee_docs_log')
              .eq('id', documentId)
              .single();
              
            if (document) {
              const existingLogs = document.employee_docs_log || [];
              
              // Log failed verification attempt
              const logEntry = {
                timestamp: new Date().toISOString(),
                action: "verify_aadhar_otp_failed",
                response: data
              };
              
              // Update only with log entry and API response data, but NOT document_status_id
              // Don't set verification_status to 'failed' or rejectedStatusId
            }
          }
          
          // Log the technical error for debugging
          console.error("OTP verification failed:", rawData);
          
          // Check if error status_code exists (QuickEKYC error format)
          // If status_code exists and is not 200, don't show details popup
          const hasErrorStatusCode = rawData.status_code && rawData.status_code !== 200;
          
          // Return user-friendly error message with 200 status to ensure frontend can access it
          const userFriendlyMessage = getUserFriendlyErrorMessage(rawData, apiResponse.status, isQuickEKYCUsed);
           await logVerificationError(supabase, {
              employeeId: employeeId,
              documentId,
              provider: useApi === 'quickekyc' ? 'quickekyc' : 'surepass',
              statusCode: data.status_code ?? apiResponse.status ?? 200,
              message: data.message || "OTP verification failed",
              response: data,
              documentTypeId: documentTypeId ?? undefined,
              documentTypeName: 'AADHAAR',
              documentNumber: documentNumber
            });
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: userFriendlyMessage,
              status_code: hasErrorStatusCode ? rawData.status_code : undefined
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        await logVerificationError(supabase, {
          employeeId,
          documentId,
          provider: currentProvider, 
          statusCode: 500,
          message:
            error instanceof Error
              ? error.message
              : 'OTP verification failed due to unexpected error',
          response: {
            error: String(error)
          },
          documentTypeId: documentTypeId ?? undefined,
          documentTypeName: 'AADHAAR',
          documentNumber: documentNumber
        });
        console.error(`Error verifying OTP with ${useApi === 'quickekyc' ? 'QuickEKYC' : 'SurePare'} API:`, error);
        return new Response(
          JSON.stringify({ success: false, error: "Unable to connect to verification service. Please try again later" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Handle reject action
    if (action === 'reject') {
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: "Document ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        // Fetch current logs
        const { data: document } = await supabase
          .from('employee_documents')
          .select('employee_docs_log')
          .eq('id', documentId)
          .single();
          
        if (document) {
          const existingLogs = document.employee_docs_log || [];
          
          // Log rejection
          const logEntry = {
            timestamp: new Date().toISOString(),
            action: "manual_reject",
            response: { reason: reject_reason || "Document rejected" },
            notes: verification_notes
          };
          
          await supabase
            .from('employee_documents')
            .update({
              employee_docs_log: [...existingLogs, logEntry],
              document_status_id: rejectedStatusId,
              verification_status: 'failed',
              verified_by: null,
              reject_reason: reject_reason || "Document verification rejected",
              api_verification_date: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Document rejected successfully" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error rejecting document:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to reject document" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Handle manual verify action
    if (action === 'manualVerify') {
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: "Document ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        // Fetch current logs
        const { data: document } = await supabase
          .from('employee_documents')
          .select('employee_docs_log')
          .eq('id', documentId)
          .single();
          
        if (document) {
          const existingLogs = document.employee_docs_log || [];
          
          // Log manual verification
          const logEntry = {
            timestamp: new Date().toISOString(),
            action: "manual_verify",
            response: { status: "approved" },
            notes: verification_notes
          };
          
          await supabase
            .from('employee_documents')
            .update({
              employee_docs_log: [...existingLogs, logEntry],
              document_status_id: governanceStatusId,
              verification_status: 'verified',
              verified_by: verified_by_employee_id || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Document verified successfully" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error verifying document:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to verify document" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ error: "Invalid action specified" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
