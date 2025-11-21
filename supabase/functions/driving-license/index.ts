import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

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
      message: response.message || "Verification Failed.",
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
    
    console.log(`Received ${action} request for driving license`, { 
      documentId, 
      hasDocNumber: !!documentNumber
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set up provider configuration for Driving License verification
    let baseUrl: string | null = null;
    let apiKey: string | null = null;
    let drivingLicenseEndpoint = "/api/v1/driving-license/driving-license";
    
    // Configure based on integration type
    if (isQuickEKYC) {
      // QuickEKYC configuration
      baseUrl = Deno.env.get("QUICKEKYC_BASE_ENDPOINT") || '';
      apiKey = Deno.env.get("QUICKEKYC_API_KEY_PROD") || '';
      drivingLicenseEndpoint = "/api/v1/driving-license/driving-license";
      console.log(`Using QuickEKYC API for driving license verification: ${baseUrl}`);
    } else {
      // Surepass configuration
      baseUrl = Deno.env.get("SUREPASS_PRODUCTION_BASE_URL") || '';
      apiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || '';
      drivingLicenseEndpoint = "/api/v1/driving-license/driving-license";
      console.log(`Using Surepass API for driving license verification: ${baseUrl}`);
    }
    
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
    
    // API Verification for Driving License - NEW BEHAVIOR
    if (action === 'apiVerify') {
      // Verify we have a document ID
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: "Document ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Fetch the document to get the license number and DOB from params
      const { data: document, error: docError } = await supabase
        .from('employee_documents')
        .select('document_number, params, employee_docs_log')
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
      
      if (!baseUrl || !apiKey) {
        return new Response(
          JSON.stringify({ error: "API configuration not found" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        const apiUrl = `${baseUrl}${drivingLicenseEndpoint}`;
        console.log(`Making request to ${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API to verify driving license with:`, {
          licenseNumber,
          dob,
          apiUrl
        });
        
        // Prepare request headers and body based on provider
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        // Only add Bearer token for Surepass, not for QuickEKYC
        if (!isQuickEKYC) {
          requestHeaders['Authorization'] = `Bearer ${apiKey}`;
        }
        
        const requestBody: any = isQuickEKYC
          ? { id_number: licenseNumber, dob: dob, key: apiKey }
          : { id_number: licenseNumber, dob: dob };
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody)
        });
        
        const rawApiResponse = await response.json();
        console.log(`${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API driving license verification response:`, rawApiResponse);
        
        // Normalize QuickEKYC response to Surepass format
        const apiResponse = isQuickEKYC ? normalizeQuickEKYCResponse(rawApiResponse) : rawApiResponse;
        
        // Create log entry with timestamp and API response
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_driving_license_api",
          response: apiResponse
        };
        
        // NEW BEHAVIOR: Always store API response and keep status as pending
        // Only set to failed if API call completely failed
        // Check success based on provider - use raw response for QuickEKYC, normalized for Surepass
        const isSuccess = isQuickEKYC
          ? (rawApiResponse.status_code === 200 && rawApiResponse.status === 'success')
          : (apiResponse.success && apiResponse.status_code === 200);
        
        if (isSuccess) {
          // API Success: Store response in api_response_data, keep status pending
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update({
              api_response_data: apiResponse,
              api_verification_status: 'completed',
              api_verification_method: 'api',
              api_verification_date: new Date().toISOString(),
              employee_docs_log: [...existingLogs, logEntry],
              updated_at: new Date().toISOString()
              // verification_status stays 'pending' - user needs to manually review
            })
            .eq('id', documentId);
          
          if (updateError) {
            console.error("Error updating document:", updateError);
            return new Response(
              JSON.stringify({ error: "Failed to store API response" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Driving license API verification completed. Please review the response.",
              requiresReview: true,
              ...apiResponse // Include the complete API response data
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // API Failure: Store response but keep status as pending for manual review
          // Don't automatically set to failed - let admin review first
          await supabase
            .from('employee_documents')
            .update({
              api_response_data: apiResponse,
              api_verification_status: 'failed',
              api_verification_method: 'api',
              api_verification_date: null,
              employee_docs_log: [...existingLogs, logEntry],
              // verification_status stays 'pending' - admin needs to manually review
              // document_status_id stays unchanged
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          
          // Parse specific error types for user-friendly messages
          let userFriendlyError = "Driving License verification failed";
          let errorCode = "DL_VERIFICATION_FAILED";
          
          // Handle QuickEKYC error messages
          if (isQuickEKYC) {
            const message = rawApiResponse?.message || '';
            if (message.includes('Verification Failed') || message.includes('verification')) {
              userFriendlyError = "This Driving License number is not found in RTO records";
              errorCode = "DL_INVALID";
            } else if (message.includes('Please Pass Valid Date of Birth') || message.includes('dob')) {
              userFriendlyError = "Date of birth doesn't match with Driving License records";
              errorCode = "DL_DOB_MISMATCH";
            } else if (rawApiResponse?.status_code === 422) {
              userFriendlyError = message || "Driving License verification failed. Please check the number and try again.";
            } else {
              userFriendlyError = message || "Driving License verification failed. Please check the number and try again.";
            }
          } else {
            // Handle Surepass error messages
            if (apiResponse.message) {
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
              } else {
                userFriendlyError = "Driving License verification failed. Please check the number and try again.";
              }
            }
          }
          
          // Return response indicating API failed but status remains pending for review
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: userFriendlyError,
              errorCode: errorCode,
              originalError: isQuickEKYC ? rawApiResponse.message : apiResponse.message,
              message: userFriendlyError,
              requiresReview: true,
              apiResponse: apiResponse // Include API response for review
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.error(`Error calling ${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API:`, error);
        
        // API call failed completely - set to failed status
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
              response: { error: error.message }
            }],
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        
        let userFriendlyError = "Something went wrong during Driving License verification. Please try again.";
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
