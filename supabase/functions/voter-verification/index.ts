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
    
    // Set up provider configuration for Voter ID verification
    let baseUrl: string | null = null;
    let apiKey: string | null = null;
    let voterIdEndpoint = "/api/v1/voter-id/voter-id";
    
    // Configure based on integration type
    if (isQuickEKYC) {
      // QuickEKYC configuration
      baseUrl = Deno.env.get("QUICKEKYC_BASE_ENDPOINT") || '';
      apiKey = Deno.env.get("QUICKEKYC_API_KEY_PROD") || '';
      voterIdEndpoint = "/api/v1/voter-id/voter-id";
      console.log(`Using QuickEKYC API for voter ID verification: ${baseUrl}`);
    } else {
      // Surepass configuration
      baseUrl = Deno.env.get("SUREPASS_PRODUCTION_BASE_URL") || '';
      apiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || '';
      voterIdEndpoint = "/api/v1/voter-id/voter-id";
      console.log(`Using Surepass API for voter ID verification: ${baseUrl}`);
    } 
      
    
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
    
    const governanceStatusId = governanceStatus?.id;
    const manualStatusId = manualStatus?.id;
    const rejectedStatusId = rejectedStatus?.id;
    
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
      .select('employee_docs_log, employee_id')
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
    
    // Handle API verification using Surepass - NEW BEHAVIOR
    if (action === 'apiVerify') {
      if (!documentNumber) {
        return new Response(
          JSON.stringify({ error: "Voter ID number is required for API verification" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (!baseUrl || !apiKey) {
        return new Response(
          JSON.stringify({ error: "API configuration not found" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        const apiUrl = `${baseUrl}${voterIdEndpoint}`;
        console.log(`Making request to ${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API to verify Voter ID with:`, apiUrl);
        
        // Prepare request headers and body based on provider
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        // Only add Bearer token for Surepass, not for QuickEKYC
        if (!isQuickEKYC) {
          requestHeaders['Authorization'] = `Bearer ${apiKey}`;
        }
        
        const requestBody: any = isQuickEKYC
          ? { id_number: documentNumber, key: apiKey }
          : { id_number: documentNumber };
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody)
        });
        
        const rawApiResponse = await response.json();
        console.log(`${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API response:`, JSON.stringify(rawApiResponse));
        
        // Normalize QuickEKYC response to Surepass format
        const data = isQuickEKYC ? normalizeQuickEKYCResponse(rawApiResponse) : rawApiResponse;
        
        // Create an API log entry with timestamp
        const apiLogEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_voter_id_api",
          response: data
        };
        
        // NEW BEHAVIOR: Always store API response and keep status as pending
        // Only set to failed if API call completely failed
        // Check success based on provider - use raw response for QuickEKYC, normalized for Surepass
        const isSuccess = isQuickEKYC
          ? (rawApiResponse.status_code === 200 && rawApiResponse.status === 'success')
          : (data.success && data.status_code === 200);
        
        if (isSuccess) {
          // API Success: Store response in api_response_data, keep status pending
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update({
              api_response_data: data,
              api_verification_status: 'completed',
              api_verification_method: 'api',
              api_verification_date: new Date().toISOString(),
              employee_docs_log: [...existingLogs, apiLogEntry],
              updated_at: new Date().toISOString()
              // verification_status stays 'pending' - user needs to manually review
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
            provider: isQuickEKYC ? 'quickekyc' : 'surepass',
            statusCode: data.status_code,
            response: data
          });

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Voter ID API verification completed. Please review the response.",
              requiresReview: true,
              ...data // Include the complete API response data
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // API Failure: Store response but keep status as pending for manual review
          // Don't automatically set to failed - let admin review first
          const apiLogEntry = {
            timestamp: new Date().toISOString(),
            action: "verify_voter_id_api_failed",
            response: data
          };
          
          // Parse specific error types for user-friendly messages
          let userFriendlyError = "Voter ID verification failed";
          let errorCode = "VOTER_ID_VERIFICATION_FAILED";
          
          // Handle QuickEKYC error messages
          if (isQuickEKYC) {
            const message = rawApiResponse?.message || '';
            if (message.includes('Verification Failed') || message.includes('verification')) {
              userFriendlyError = "This Voter ID is not found in electoral records";
              errorCode = "VOTER_ID_INVALID";
            } else if (rawApiResponse?.status_code === 422) {
              userFriendlyError = message || "Voter ID verification failed. Please check the number and try again.";
            } else {
              userFriendlyError = message || "Voter ID verification failed. Please check the number and try again.";
            }
          } else {
            // Handle Surepass error messages
            if (data.message) {
              const message = data.message.toLowerCase();
              if (message.includes('invalid voter') || message.includes('voter id not found')) {
                userFriendlyError = "This Voter ID is not found in electoral records";
                errorCode = "VOTER_ID_INVALID";
              } else if (message.includes('format') || message.includes('pattern')) {
                userFriendlyError = "Please enter a valid Voter ID number";
                errorCode = "VOTER_ID_INVALID_FORMAT";
              } else if (message.includes('expired') || message.includes('inactive')) {
                userFriendlyError = "This Voter ID appears to be expired or inactive";
                errorCode = "VOTER_ID_EXPIRED";
              } else {
                userFriendlyError = "Voter ID verification failed. Please check the number and try again.";
              }
            }
          }
          await logVerificationError(supabase, {
            employeeId,
            documentId,
            provider: isQuickEKYC ? 'quickekyc' : 'surepass',
            statusCode: data.status_code ?? rawApiResponse?.status_code,
            message: data.message,
            response: data
          });
          // Return response indicating API failed but status remains pending for review
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: userFriendlyError,
              errorCode: errorCode,
              originalError: isQuickEKYC ? rawApiResponse.message : data.message,
              message: userFriendlyError,
              requiresReview: true,
              apiResponse: data // Include API response for review
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.error(`Error verifying Voter ID with ${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API:`, error);
        
        // API call failed completely - store error but keep status pending for review
        await supabase
          .from('employee_documents')
          .update({
            api_verification_status: 'failed',
            api_verification_method: 'api',
            employee_docs_log: [...existingLogs, {
              timestamp: new Date().toISOString(),
              action: "verify_voter_id_api_error",
              response: { error: error.message }
            }],
            // verification_status stays 'pending' - admin needs to manually review
            // document_status_id stays unchanged
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        
        let userFriendlyError = "Something went wrong during Voter ID verification. Please try again.";
        let errorCode = "INTERNAL_ERROR";
        
        if (error.message?.includes('timeout') || error.message?.includes('connection')) {
          userFriendlyError = "Verification service is temporarily unavailable. Please try again.";
          errorCode = "CONNECTION_TIMEOUT";
        } else if (error.message?.includes('429') || error.message?.includes('limit')) {
          userFriendlyError = "Too many verification attempts. Please try again after some time.";
          errorCode = "API_LIMIT_EXCEEDED";
        }
        
        return new Response(
          JSON.stringify({ 
            success: false,
            error: userFriendlyError,
            errorCode: errorCode,
            originalError: error.message
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
