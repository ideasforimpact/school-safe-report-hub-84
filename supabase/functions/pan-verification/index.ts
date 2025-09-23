import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// CORS headers setup
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      verification_notes,
      verified_by_employee_id,
      reject_reason
    } = requestBody;
    
    console.log(`PAN Verification: Received ${action} request`, { 
      documentId, 
      hasDocNumber: !!documentNumber,
      notes: verification_notes,
      verified_by_employee_id: verified_by_employee_id
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set up production vs. sandbox environment for the Surepass API
    const environment = Deno.env.get("ENVIRONMENT") || "development";
    
    // Default base URL and API key
    let baseUrl = environment === "production" 
      ? Deno.env.get("SUREPASS_PRODUCTION_BASE_URL") || "https://kyc-api.surepass.io"
      : "https://sandbox.surepass.io";
    
    let apiKey = environment === "production" 
      ? Deno.env.get("SUREPASS_PRODUCTION_API_KEY") 
      : Deno.env.get("SUREPASS_SANDBOX_API_KEY");
    
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
    
    // Handle API verification using Surepass - NEW BEHAVIOR
    if (action === 'apiVerify') {
      if (!documentNumber) {
        return new Response(
          JSON.stringify({ error: "Document number is required for API verification" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        console.log("Making request to Surepass API to verify PAN with base URL:", baseUrl);
        
        // Changed API endpoint from pan-comprehensive-v2 to pan-comprehensive
        const response = await fetch(`${baseUrl}/api/v1/pan/pan-comprehensive`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ id_number: documentNumber })
        });
        
        const data = await response.json();
        console.log("Surepass API response:", JSON.stringify(data));
        
        // Create an API log entry with timestamp
        const apiLogEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_pan_api",
          response: data
        };
        
        // NEW BEHAVIOR: Always store API response and keep status as pending
        // Only set to failed if API call completely failed
        if (data.success && data.status_code === 200) {
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
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "PAN API verification completed. Please review the response.",
              requiresReview: true,
              ...data // Include the complete API response data
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // API Failure: Set status to failed immediately
          const apiLogEntry = {
            timestamp: new Date().toISOString(),
            action: "verify_pan_api_failed",
            response: data
          };
          
          await supabase
            .from('employee_documents')
            .update({
              employee_docs_log: [...existingLogs, apiLogEntry],
              document_status_id: rejectedStatusId,
              verification_status: 'failed',
              api_verification_status: 'failed',
              api_verification_method: 'api',
              api_verification_date: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          
          // Parse specific error types for user-friendly messages
          let userFriendlyError = "PAN verification failed";
          let errorCode = "PAN_VERIFICATION_FAILED";
          
          if (data.message) {
            const message = data.message.toLowerCase();
            if (message.includes('invalid pan') || message.includes('pan not found')) {
              userFriendlyError = "This PAN number is not found in government records";
              errorCode = "PAN_INVALID";
            } else if (message.includes('format') || message.includes('pattern')) {
              userFriendlyError = "Please enter a valid PAN number (e.g., ABCDE1234F)";
              errorCode = "PAN_INVALID_FORMAT";
            } else if (message.includes('already linked')) {
              userFriendlyError = "This PAN is already linked to another Aadhaar";
              errorCode = "PAN_ALREADY_LINKED";
            } else {
              userFriendlyError = "PAN verification failed. Please check the number and try again.";
            }
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: userFriendlyError,
              errorCode: errorCode,
              originalError: data.message,
              status: "failed",
              statusId: rejectedStatusId
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.error("Error verifying PAN with Surepass API:", error);
        
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
              action: "verify_pan_api_error",
              response: { error: error.message }
            }],
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        
        let userFriendlyError = "Something went wrong during PAN verification. Please try again.";
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
        console.log(`Manual verification - verified_by_employee_id: ${verified_by_employee_id}`);
        
        if (!verified_by_employee_id) {
          console.error("Missing verified_by_employee_id for manual verification");
          return new Response(
            JSON.stringify({ error: "Employee ID is required for manual verification" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Create log entry for manual verification
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_pan_manual",
          notes: verification_notes || "Manually verified by staff",
          verified_by: verified_by_employee_id
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
            message: "PAN manually verified",
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
    
    // Handle rejection
    else if (action === 'reject') {
      try {
        console.log(`Rejection - verified_by_employee_id: ${verified_by_employee_id}`);
        
        if (!verified_by_employee_id) {
          console.error("Missing verified_by_employee_id for rejection");
          return new Response(
            JSON.stringify({ error: "Employee ID is required for rejection" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Create log entry for rejection
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "reject_pan",
          notes: verification_notes || "Document verification rejected",
          verified_by: verified_by_employee_id
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
            message: "PAN verification rejected",
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
