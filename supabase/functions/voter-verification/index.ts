// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import { logVerificationError, logVerificationSuccess } from "../_shared/verificationAuditlog.ts";
import { recordEmployeeVerificationApiCall } from "../_shared/employeeVerificationApiCalls.ts";

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
      message: response.message || "Verification Failed",
      data: response.data || {}
    };
  }
}

/** Call voter ID API for a given provider. Returns normalized data and success flag. */
async function callVoterIdProvider(
  provider: 'quickekyc' | 'surepass',
  documentNumber: string
): Promise<{ success: boolean; data: any; rawApiResponse: any }> {
  const voterIdEndpoint = "/api/v1/voter-id/voter-id";
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
  const apiUrl = `${baseUrl}${voterIdEndpoint}`;
  const requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (provider === 'surepass') {
    requestHeaders['Authorization'] = `Bearer ${apiKey}`;
  }
  const body = provider === 'quickekyc'
    ? { id_number: documentNumber, key: apiKey }
    : { id_number: documentNumber };
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
    
    console.log(`Voter ID Verification: Received ${action} request`, { 
      documentId, 
      hasDocNumber: !!documentNumber,
      notes: verification_notes
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, fetch document status IDs for governance, manual and rejected statuses
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
    
    console.log("Status IDs found:", {
      governance: governanceStatusId,
      manual: manualStatusId,
      rejected: rejectedStatusId
    });
    
    // Get the employee document first to work with
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "Document ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { data: document, error: documentError } = await supabase
      .from('employee_documents')
      .select('employee_docs_log, employee_id, document_type_id')
      .eq('id', documentId)
      .single();
    
    if (documentError) {
      console.error("Error fetching document:", documentError);
      return new Response(
        JSON.stringify({ error: "Could not fetch document details" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get existing logs or initialize empty array
    const existingLogs = document?.employee_docs_log || [];
    const employeeId = document.employee_id;
    let documentTypeId = document?.document_type_id;
    if (!documentTypeId) {
      const { data: voterType, error: voterTypeError } = await supabase
        .from("employee_document_type")
        .select("id")
        .eq("name", "VOTER_ID")
        .single();
      if (!voterTypeError && voterType?.id) {
        documentTypeId = voterType.id;
      } else {
        console.warn("Voter verification: unable to resolve document_type_id", {
          documentId,
          voterTypeError,
        });
      }
    }

    // Handle API verification: primary = QuickEKYC, fallback = Surepass
    if (action === 'apiVerify') {
      if (!documentNumber) {
        return new Response(
          JSON.stringify({ error: "Voter ID number is required for API verification" }),
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
      const safeRecord = async (attemptProvider: 'quickekyc' | 'surepass', isSuccess: boolean) => {
        try {
          await recordEmployeeVerificationApiCall({
            supabase,
            employeeId,
            documentId,
            documentTypeId: documentTypeId ?? null,
            provider: attemptProvider,
            primaryProvider: PRIMARY_PROVIDER,
            isMultiple: false,
            isSuccess,
          });
        } catch (e) {
          console.error("Voter API call counter record failed:", e);
        }
      };
      try {
        // 1) Try primary provider (QuickEKYC)
        console.log(`Making request to primary (QuickEKYC) API for Voter ID verification`);
        const primaryResult = await callVoterIdProvider(PRIMARY_PROVIDER, documentNumber);
        console.log('Primary (QuickEKYC) API response:', JSON.stringify(primaryResult.rawApiResponse));

        // Record API result for primary provider (updates success/failed).
        await safeRecord(PRIMARY_PROVIDER, primaryResult.success);

        if (primaryResult.success) {
          const data = primaryResult.data;
          const apiLogEntry = {
            timestamp: new Date().toISOString(),
            action: "verify_voter_id_api",
            response: data
          };
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update({
              api_response_data: data,
              api_verification_status: 'completed',
              api_verification_method: 'api',
              api_verification_date: new Date().toISOString(),
              employee_docs_log: [...existingLogs, apiLogEntry],
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          if (updateError) {
            console.error("Error updating document with API response:", updateError);
            return new Response(
              JSON.stringify({ error: "Failed to store API response" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          await logVerificationSuccess(supabase, {
            employeeId,
            documentId,
            provider: 'quickekyc',
            statusCode: data.status_code,
            response: data,
            documentTypeId: documentTypeId ?? undefined,
            documentTypeName: 'VOTER_ID',
            documentNumber: documentNumber
          });
          return new Response(
            JSON.stringify({
              success: true,
              message: "Voter ID API verification completed. Please review the response.",
              requiresReview: true,
              ...data
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // 2) Primary failed: try fallback (Surepass)
        const fallbackBaseUrl = Deno.env.get("SUREPASS_PRODUCTION_BASE_URL") || '';
        const fallbackApiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || '';
        if (!fallbackBaseUrl || !fallbackApiKey) {
          // No fallback config: log primary failure and return
          await logVerificationError(supabase, {
            employeeId,
            documentId,
            provider: 'quickekyc',
            statusCode: primaryResult.data?.status_code ?? primaryResult.rawApiResponse?.status_code,
            message: primaryResult.data?.message ?? primaryResult.rawApiResponse?.message,
            response: primaryResult.data,
            documentTypeId: documentTypeId ?? undefined,
            documentTypeName: 'VOTER_ID',
            documentNumber: documentNumber
          });
          return new Response(
            JSON.stringify({
              success: false,
              error: "Voter ID verification failed",
              errorCode: "VOTER_ID_VERIFICATION_FAILED",
              requiresReview: true,
              apiResponse: primaryResult.data
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const primaryFailureEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_voter_id_api_failed",
          response: primaryResult.data
        };
        const logsWithPrimaryFailure = [...existingLogs, primaryFailureEntry];

        lastAttemptedProvider = 'surepass';
        console.log(`Primary failed; calling fallback (Surepass) API for Voter ID verification`);
        const fallbackResult = await callVoterIdProvider(FALLBACK_PROVIDER, documentNumber);
        console.log('Fallback (Surepass) API response:', JSON.stringify(fallbackResult.rawApiResponse));

        // Record API result for fallback provider (updates other_provider_* counters).
        await safeRecord(FALLBACK_PROVIDER, fallbackResult.success);

        if (fallbackResult.success) {
          const data = fallbackResult.data;
          const apiLogEntry = {
            timestamp: new Date().toISOString(),
            action: "verify_voter_id_api",
            response: data
          };
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update({
              api_response_data: data,
              api_verification_status: 'completed',
              api_verification_method: 'api',
              api_verification_date: new Date().toISOString(),
              employee_docs_log: [...logsWithPrimaryFailure, apiLogEntry],
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          if (updateError) {
            console.error("Error updating document with API response:", updateError);
            return new Response(
              JSON.stringify({ error: "Failed to store API response" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          await logVerificationSuccess(supabase, {
            employeeId,
            documentId,
            provider: 'surepass',
            statusCode: data.status_code,
            response: data,
            documentTypeId: documentTypeId ?? undefined,
            documentTypeName: 'VOTER_ID',
            documentNumber: documentNumber
          });
          return new Response(
            JSON.stringify({
              success: true,
              message: "Voter ID API verification completed (fallback). Please review the response.",
              requiresReview: true,
              ...data
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // 3) Both primary and fallback failed: in-progress only when message does NOT match known patterns
        const data = fallbackResult.data;
        const rawApiResponse = fallbackResult.rawApiResponse;
        const IN_PROGRESS_MSG = "Your verification request is being processed. In some cases, additional checks are required to ensure accuracy and compliance.";
        let userFriendlyError = "Voter ID verification failed";
        let errorCode = "VOTER_ID_VERIFICATION_FAILED";
        let error_key: string | undefined;
        let isKnownError = false;

        if (data?.message) {
          const message = data.message.toLowerCase();
          if (message.includes('invalid voter') || message.includes('voter id not found')) {
            userFriendlyError = "This Voter ID is not found in electoral records";
            errorCode = "VOTER_ID_INVALID";
            isKnownError = true;
          } else if (message.includes('format') || message.includes('pattern')) {
            userFriendlyError = "Please enter a valid Voter ID number";
            errorCode = "VOTER_ID_INVALID_FORMAT";
            isKnownError = true;
          } else if (message.includes('expired') || message.includes('inactive')) {
            userFriendlyError = "This Voter ID appears to be expired or inactive";
            errorCode = "VOTER_ID_EXPIRED";
            isKnownError = true;
          }
        }

        const fallbackFailureEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_voter_id_api_failed",
          response: data
        };

        if (!isKnownError) {
          userFriendlyError = IN_PROGRESS_MSG;
          error_key = "in-progress";
          await supabase
            .from('employee_documents')
            .update({
              employee_docs_log: [...logsWithPrimaryFailure, fallbackFailureEntry],
              verification_status: 'in-progress',
              document_status_id: inProgressStatusId,
              api_verification_status: 'failed',
              api_verification_method: 'api',
              api_verification_date: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
        } else {
          await supabase
            .from('employee_documents')
            .update({
              employee_docs_log: [...logsWithPrimaryFailure, fallbackFailureEntry],
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
        }

        const bothFallback = data?.success === false;
        await logVerificationError(supabase, {
          employeeId,
          documentId,
          provider: 'surepass',
          statusCode: data?.status_code ?? rawApiResponse?.status_code,
          message: data?.message,
          response: data,
          bothFallback,
          documentTypeId: documentTypeId ?? undefined,
          documentTypeName: 'VOTER_ID',
          documentNumber: documentNumber
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: userFriendlyError,
            errorCode,
            originalError: data?.message ?? rawApiResponse?.message,
            message: userFriendlyError,
            requiresReview: true,
            bothFallback,
            apiResponse: data,
            ...(error_key !== undefined && { error_key })
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error verifying Voter ID (primary/fallback):", error);
        await supabase
          .from('employee_documents')
          .update({
            api_verification_status: 'failed',
            api_verification_method: 'api',
            employee_docs_log: [...existingLogs, {
              timestamp: new Date().toISOString(),
              action: "verify_voter_id_api_error",
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
          documentTypeName: 'VOTER_ID',
          documentNumber: documentNumber
        });
        let userFriendlyError = "Something went wrong during Voter ID verification. Please try again.";
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
    
    // Handle manual verification
    else if (action === 'manualVerify') {
      try {
        // Create log entry for manual verification
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_voter_id_manual",
          notes: verification_notes || "Manually verified by staff"
        };
        
        // Update document with verification status and manual status
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
            message: "Voter ID manually verified",
            status: "verified",
            statusId: manualStatusId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error in manual verification:", error);
        return new Response(
          JSON.stringify({ error: "Failed to process manual verification" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    else if (action === 'approveAfterApi') {
      try {
        if (!verified_by_employee_id) {
          return new Response(
            JSON.stringify({ error: "Employee ID is required for approval" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "approve_after_api",
          notes: verification_notes || "Approved after Voter ID API check",
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
          return new Response(
            JSON.stringify({ error: "Failed to approve document" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Approval failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    
    // Handle rejection
    else if (action === 'reject') {
      try {
        // Create log entry for rejection
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "reject_voter_id",
          notes: verification_notes || "Document verification rejected"
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
          console.error("Error updating document with rejection:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update document status" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Voter ID verification rejected",
            status: "failed",
            statusId: rejectedStatusId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error in rejection:", error);
        return new Response(
          JSON.stringify({ error: "Failed to process rejection" }),
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
