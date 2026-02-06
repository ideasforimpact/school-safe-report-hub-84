import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import { logVerificationError, logVerificationSuccess } from "../_shared/verificationAuditlog.ts";

// CORS headers setup
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Primary provider for apiVerify: always try QuickEKYC first, then Surepass as fallback
const PRIMARY_PROVIDER = 'quickekyc';
const FALLBACK_PROVIDER = 'surepass';

// Helper function to normalize QuickEKYC response to Surepass format
function normalizeQuickEKYCResponse(response: any): any {
  // QuickEKYC response structure is almost identical to Surepass
  // Main difference: request_id vs client_id, and status field
  if (response.status_code === 200 && response.status === 'success') {
    // Success response - normalize to Surepass format
    return {
      success: true,
      status_code: 200,
      message: response.message || null,
      message_code: "success",
      data: {
        ...response.data,
        client_id: response.request_id?.toString() || null // Map request_id to client_id
      }
    };
  } else {
    // Error response - normalize to Surepass format
    return {
      success: false,
      status_code: response.status_code,
      message: response.message || "Verification Failed.",
      data: response.data || {}
    };
  }
}

/** Call driving license API for a given provider. Returns normalized data and success flag. */
async function callDrivingLicenseProvider(
  provider: 'quickekyc' | 'surepass',
  licenseNumber: string,
  dob: string
): Promise<{ success: boolean; data: any; rawApiResponse: any }> {
  const drivingLicenseEndpoint = "/api/v1/driving-license/driving-license";
  let baseUrl: string;
  let apiKey: string;
  if (provider === 'quickekyc') {
    baseUrl = Deno.env.get("QUICKEKYC_BASE_ENDPOINT") || '';
    apiKey = Deno.env.get("QUICKEKYC_API_KEY_PROD") || '';
  } else {
    baseUrl = Deno.env.get("SUREPASS_PRODUCTION_BASE_URL") || '';
    apiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || '';
  }
  if (!baseUrl || !apiKey) {
    return { success: false, data: {}, rawApiResponse: { message: 'API configuration not found' } };
  }
  const apiUrl = `${baseUrl}${drivingLicenseEndpoint}`;
  const requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (provider === 'surepass') {
    requestHeaders['Authorization'] = `Bearer ${apiKey}`;
  }
  const body = provider === 'quickekyc'
    ? { id_number: licenseNumber, dob, key: apiKey }
    : { id_number: licenseNumber, dob };
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(body)
  });
  const rawApiResponse = await response.json();
  const data = provider === 'quickekyc' ? normalizeQuickEKYCResponse(rawApiResponse) : rawApiResponse;
  const success = provider === 'quickekyc'
    ? (rawApiResponse.status_code === 200 && rawApiResponse.status === 'success')
    : (data.success && data.status_code === 200);
  return { success, data, rawApiResponse };
}

/** Extract personal_info from API response data for employee_documents update. */
function extractPersonalInfoFromApiResponse(apiData: any): { dob?: string; address?: string } | null {
  if (!apiData?.dob && !apiData?.permanent_address) return null;
  const personalInfo: { dob?: string; address?: string } = {};
  if (apiData.dob) {
    const dobStr = String(apiData.dob).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) {
      personalInfo.dob = dobStr;
    } else {
      const dobDate = new Date(dobStr);
      if (!isNaN(dobDate.getTime())) {
        const year = dobDate.getFullYear();
        const month = String(dobDate.getMonth() + 1).padStart(2, '0');
        const day = String(dobDate.getDate()).padStart(2, '0');
        personalInfo.dob = `${year}-${month}-${day}`;
      }
    }
  }
  if (apiData.permanent_address) {
    personalInfo.address = String(apiData.permanent_address);
  }
  return personalInfo;
}

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
      verification_notes,
      verified_by_employee_id,
      reject_reason
    } = requestBody;
    
    console.log(`Received ${action} request for driving license`, { 
      documentId, 
      hasDocNumber: !!documentNumber
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, fetch document status IDs we need
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
    
    const governanceStatusId = governanceStatus?.id;
    const rejectedStatusId = rejectedStatus?.id;
    const manualStatusId = manualStatus?.id;
    
    console.log("Status IDs found:", {
      governanceStatusId,
      rejectedStatusId,
      manualStatusId
    });
    
    // API Verification for Driving License: primary = QuickEKYC, fallback = Surepass
    if (action === 'apiVerify') {
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: "Document ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: document, error: docError } = await supabase
        .from('employee_documents')
        .select('document_number, params, employee_docs_log, employee_id, document_type_id')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        console.error("Error fetching document:", docError);
        return new Response(
          JSON.stringify({ error: "Document not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const licenseNumber = document.document_number;
      const dob = document.params?.DOB;
      const existingLogs = document?.employee_docs_log || [];
      const employeeId = document.employee_id;
      const documentTypeId = document?.document_type_id;

      if (!licenseNumber) {
        return new Response(
          JSON.stringify({ error: "License number is required for verification" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!dob) {
        return new Response(
          JSON.stringify({ error: "Date of birth is required for driving license verification" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const primaryBaseUrl = Deno.env.get("QUICKEKYC_BASE_ENDPOINT") || '';
      const primaryApiKey = Deno.env.get("QUICKEKYC_API_KEY_PROD") || '';
      if (!primaryBaseUrl || !primaryApiKey) {
        return new Response(
          JSON.stringify({ error: "API configuration not found (primary provider)" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let lastAttemptedProvider: 'quickekyc' | 'surepass' = 'quickekyc';
      try {
        // 1) Try primary provider (QuickEKYC)
        console.log("Making request to primary (QuickEKYC) API for driving license verification");
        const primaryResult = await callDrivingLicenseProvider(PRIMARY_PROVIDER, licenseNumber, dob);
        console.log("Primary (QuickEKYC) API response:", JSON.stringify(primaryResult.rawApiResponse));

        if (primaryResult.success) {
          const apiResponse = primaryResult.data;
          const apiData = apiResponse?.data || {};
          const personalInfo = extractPersonalInfoFromApiResponse(apiData);
          const logEntry = {
            timestamp: new Date().toISOString(),
            action: "verify_driving_license_api",
            response: apiResponse
          };
          const updateData: any = {
            api_response_data: apiResponse,
            api_verification_status: 'completed',
            api_verification_method: 'api',
            api_verification_date: new Date().toISOString(),
            employee_docs_log: [...existingLogs, logEntry],
            updated_at: new Date().toISOString()
          };
          if (personalInfo) updateData.personal_info = personalInfo;
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update(updateData)
            .eq('id', documentId);
          if (updateError) {
            console.error("Error updating document:", updateError);
            return new Response(
              JSON.stringify({ error: "Failed to store API response" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          await logVerificationSuccess(supabase, {
            employeeId,
            documentId,
            provider: 'quickekyc',
            statusCode: apiResponse.status_code,
            response: apiResponse,
            documentTypeId: documentTypeId ?? undefined,
            documentTypeName: 'DRIVING_LICENSE',
            documentNumber: licenseNumber,
            documentContext: { dob }
          });
          return new Response(
            JSON.stringify({
              success: true,
              message: "Driving license API verification completed. Please review the response.",
              requiresReview: true,
              ...apiResponse
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // 2) Primary failed: try fallback (Surepass)
        const fallbackBaseUrl = Deno.env.get("SUREPASS_PRODUCTION_BASE_URL") || '';
        const fallbackApiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || '';
        if (!fallbackBaseUrl || !fallbackApiKey) {
          await logVerificationError(supabase, {
            employeeId,
            documentId,
            provider: 'quickekyc',
            statusCode: primaryResult.data?.status_code ?? primaryResult.rawApiResponse?.status_code,
            message: primaryResult.data?.message ?? primaryResult.rawApiResponse?.message,
            response: primaryResult.data,
            documentTypeId: documentTypeId ?? undefined,
            documentTypeName: 'DRIVING_LICENSE',
            documentNumber: licenseNumber,
            documentContext: { dob }
          });
          const userFriendlyError = "Driving License verification failed";
          return new Response(
            JSON.stringify({
              success: false,
              error: userFriendlyError,
              errorCode: "DL_VERIFICATION_FAILED",
              requiresReview: true,
              apiResponse: primaryResult.data
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const primaryFailureEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_driving_license_api_failed",
          response: primaryResult.data
        };
        const logsWithPrimaryFailure = [...existingLogs, primaryFailureEntry];

        lastAttemptedProvider = 'surepass';
        console.log("Primary failed; calling fallback (Surepass) API for driving license verification");
        const fallbackResult = await callDrivingLicenseProvider(FALLBACK_PROVIDER, licenseNumber, dob);
        console.log("Fallback (Surepass) API response:", JSON.stringify(fallbackResult.rawApiResponse));

        if (fallbackResult.success) {
          const apiResponse = fallbackResult.data;
          const apiData = apiResponse?.data || {};
          const personalInfo = extractPersonalInfoFromApiResponse(apiData);
          const logEntry = {
            timestamp: new Date().toISOString(),
            action: "verify_driving_license_api",
            response: apiResponse
          };
          const updateData: any = {
            api_response_data: apiResponse,
            api_verification_status: 'completed',
            api_verification_method: 'api',
            api_verification_date: new Date().toISOString(),
            employee_docs_log: [...logsWithPrimaryFailure, logEntry],
            updated_at: new Date().toISOString()
          };
          if (personalInfo) updateData.personal_info = personalInfo;
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update(updateData)
            .eq('id', documentId);
          if (updateError) {
            console.error("Error updating document:", updateError);
            return new Response(
              JSON.stringify({ error: "Failed to store API response" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          await logVerificationSuccess(supabase, {
            employeeId,
            documentId,
            provider: 'surepass',
            statusCode: apiResponse.status_code,
            response: apiResponse,
            documentTypeId: documentTypeId ?? undefined,
            documentTypeName: 'DRIVING_LICENSE',
            documentNumber: licenseNumber,
            documentContext: { dob }
          });
          return new Response(
            JSON.stringify({
              success: true,
              message: "Driving license API verification completed (fallback). Please review the response.",
              requiresReview: true,
              ...apiResponse
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // 3) Both primary and fallback failed: log error with bothFallback true
        const apiResponse = fallbackResult.data;
        const rawApiResponse = fallbackResult.rawApiResponse;
        let userFriendlyError = "Driving License verification failed";
        let errorCode = "DL_VERIFICATION_FAILED";
        if (apiResponse?.message) {
          const message = apiResponse.message.toLowerCase();
          if (message.includes('invalid driving') || message.includes('not found in rto')) {
            userFriendlyError = "This Driving License number is not found in RTO records";
            errorCode = "DL_INVALID";
          } else if (message.includes('expired')) {
            userFriendlyError = "This Driving License has expired";
            errorCode = "DL_EXPIRED";
          } else if (message.includes('dob') || message.includes('date of birth')) {
            userFriendlyError = "Date of birth doesn't match with Driving License records";
            errorCode = "DL_DOB_MISMATCH";
          } else if (message.includes('format') || message.includes('pattern')) {
            userFriendlyError = "Please enter a valid Driving License number";
            errorCode = "DL_INVALID_FORMAT";
          }
        }
        const fallbackFailureEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_driving_license_api_failed",
          response: apiResponse
        };
        await supabase
          .from('employee_documents')
          .update({
            employee_docs_log: [...logsWithPrimaryFailure, fallbackFailureEntry],
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        const bothFallback = apiResponse?.success === false;
        await logVerificationError(supabase, {
          employeeId,
          documentId,
          provider: 'surepass',
          statusCode: apiResponse?.status_code ?? rawApiResponse?.status_code,
          message: apiResponse?.message,
          response: apiResponse,
          bothFallback,
          documentTypeId: documentTypeId ?? undefined,
          documentTypeName: 'DRIVING_LICENSE',
          documentNumber: licenseNumber,
          documentContext: { dob }
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: userFriendlyError,
            errorCode,
            originalError: apiResponse?.message ?? rawApiResponse?.message,
            message: userFriendlyError,
            requiresReview: true,
            bothFallback,
            apiResponse
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error verifying Driving License (primary/fallback):", error);
        await supabase
          .from('employee_documents')
          .update({
            verification_status: 'failed',
            document_status_id: rejectedStatusId,
            api_verification_status: 'failed',
            api_verification_method: 'api',
            employee_docs_log: [...existingLogs, {
              timestamp: new Date().toISOString(),
              action: "verify_driving_license_api_error",
              response: { error: (error as Error).message }
            }],
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        await logVerificationError(supabase, {
          employeeId,
          documentId,
          provider: lastAttemptedProvider,
          message: (error as Error).message,
          response: { error: (error as Error).message },
          bothFallback: lastAttemptedProvider === 'surepass',
          documentTypeId: documentTypeId ?? undefined,
          documentTypeName: 'DRIVING_LICENSE',
          documentNumber: licenseNumber,
          documentContext: { dob }
        });
        let userFriendlyError = "Something went wrong during Driving License verification. Please try again.";
        let errorCode = "INTERNAL_ERROR";
        if ((error as Error).message?.includes('timeout') || (error as Error).message?.includes('connection')) {
          userFriendlyError = "Verification service is temporarily unavailable. Please try again.";
          errorCode = "CONNECTION_TIMEOUT";
        } else if ((error as Error).message?.includes('429') || (error as Error).message?.includes('limit')) {
          userFriendlyError = "Too many verification attempts. Please try again after some time.";
          errorCode = "API_LIMIT_EXCEEDED";
        }
        return new Response(
          JSON.stringify({
            success: false,
            error: userFriendlyError,
            errorCode,
            originalError: (error as Error).message
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } 
    // Manual verification for Driving License
    else if (action === 'manualVerify') {
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: "Document ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        // Get existing logs
        const { data: document, error: fetchError } = await supabase
          .from('employee_documents')
          .select('employee_docs_log')
          .eq('id', documentId)
          .single();
          
        if (fetchError) {
          console.error("Error fetching document:", fetchError);
          return new Response(
            JSON.stringify({ error: "Document not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const existingLogs = document?.employee_docs_log || [];
        
        // Create log entry
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_driving_license_manual",
          notes: verification_notes || "Document manually verified by staff."
        };
        
        // Update document with manual verification status
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'verified',
            employee_docs_log: [...existingLogs, logEntry],
            document_status_id: manualStatusId,
            verified_by: verified_by_employee_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        
        if (updateError) {
          console.error("Error updating document with manual verification:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update document status" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Driving license manually verified successfully"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error in manual verification:", error);
        return new Response(
          JSON.stringify({ error: "Failed to manually verify document" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    else if (action === 'approveAfterApi') {
      try {
        if (!documentId) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Document ID is required for approval",
              errorCode: "MISSING_DOCUMENT_ID"
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (!verified_by_employee_id) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Employee ID is required for approval",
              errorCode: "MISSING_EMPLOYEE_ID"
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Fetch existing document logs
        const { data: document, error: fetchError } = await supabase
          .from('employee_documents')
          .select('employee_docs_log')
          .eq('id', documentId)
          .single();
          
        if (fetchError) {
          console.error("Error fetching document:", fetchError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Document not found. Please refresh and try again.",
              errorCode: "DOCUMENT_NOT_FOUND"
            }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const existingLogs = document?.employee_docs_log || [];
        
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "approve_after_api",
          notes: verification_notes || "Approved after Driving License API check",
          verified_by: verified_by_employee_id
        };
        
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'verified',
            document_status_id: governanceStatusId,
            verified_by: verified_by_employee_id,
            employee_docs_log: [...existingLogs, logEntry],
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
          
        if (updateError) {
          console.error("Error updating document:", updateError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Failed to update document status. Please try again.",
              errorCode: "UPDATE_FAILED",
              originalError: updateError.message
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Driving License approved successfully"
          }), 
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error: any) {
        console.error("Error in approveAfterApi:", error);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "An unexpected error occurred. Please try again.",
            errorCode: "INTERNAL_ERROR",
            originalError: error.message
          }), 
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // Reject verification
    // Reject verification
    else if (action === 'reject') {
      try {
      if (!documentId) {
        return new Response(
            JSON.stringify({ 
              success: false,
              error: "Document ID is required for rejection",
              errorCode: "MISSING_DOCUMENT_ID"
            }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
        // Get existing logs
        const { data: document, error: fetchError } = await supabase
          .from('employee_documents')
          .select('employee_docs_log')
          .eq('id', documentId)
          .single();
          
        if (fetchError) {
          console.error("Error fetching document:", fetchError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Document not found. Please refresh and try again.",
              errorCode: "DOCUMENT_NOT_FOUND"
            }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const existingLogs = document?.employee_docs_log || [];
        
        // Create rejection log entry
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "reject_driving_license",
          notes: verification_notes || reject_reason || "Document verification rejected by staff."
        };
        
        // Update document with rejected status and reject reason
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'failed',
            employee_docs_log: [...existingLogs, logEntry],
            document_status_id: rejectedStatusId,
            verified_by: null,
            reject_reason: reject_reason || "Document verification rejected",
            api_verification_date: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        
        if (updateError) {
          console.error("Error updating document as rejected:", updateError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "Failed to update document status. Please try again.",
              errorCode: "UPDATE_FAILED",
              originalError: updateError.message
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Driving License rejected successfully"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error: any) {
        console.error("Error in rejection process:", error);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "An unexpected error occurred. Please try again.",
            errorCode: "INTERNAL_ERROR",
            originalError: error.message
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Invalid action
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
