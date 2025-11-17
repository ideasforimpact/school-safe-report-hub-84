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
    
    console.log(`Received ${action} request for driving license`, { 
      documentId, 
      hasDocNumber: !!documentNumber
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set up production vs. sandbox environment for the Surepass API
    const environment = Deno.env.get("ENVIRONMENT") || "development";
    
    // Default base URL for Surepass API and API key
    let baseUrl = Deno.env.get("SUREPASS_PRODUCTION_BASE_URL");
    
    let apiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY");
    
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
      
      try {
        console.log("Making request to Surepass API to verify driving license with:", {
          licenseNumber,
          dob,
          baseUrl
        });
        
        const response = await fetch(`${baseUrl}/api/v1/driving-license/driving-license`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ id_number: licenseNumber, dob: dob })
        });
        
        const apiResponse = await response.json();
        console.log("Surepass API driving license verification response:", apiResponse);
        
        // Create log entry with timestamp and API response
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "verify_driving_license_api",
          response: apiResponse
        };
        
        // NEW BEHAVIOR: Always store API response and keep status as pending
        // Only set to failed if API call completely failed
        if (apiResponse.success && apiResponse.status_code === 200) {
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
          // API Failure: Set status to failed immediately
          await supabase
            .from('employee_documents')
            .update({
              verification_status: 'failed',
              employee_docs_log: [...existingLogs, logEntry],
              document_status_id: rejectedStatusId,
              api_verification_status: 'failed',
              api_verification_method: 'api',
              api_verification_date: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          
          // Parse specific error types for user-friendly messages
          let userFriendlyError = "Driving License verification failed";
          let errorCode = "DL_VERIFICATION_FAILED";
          
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
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: userFriendlyError,
              errorCode: errorCode,
              originalError: apiResponse.message,
              message: userFriendlyError
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.error("Error calling Surepass API:", error);
        
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
        if (!verified_by_employee_id) {
          return new Response(
            JSON.stringify({ error: "Employee ID is required for approval" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
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
    // Reject verification
    else if (action === 'reject') {
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
        
        // Create rejection log entry
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "reject_driving_license",
          notes: verification_notes || "Document verification rejected by staff."
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
            JSON.stringify({ error: "Failed to update document status" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Driving license verification rejected"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error in rejection process:", error);
        return new Response(
          JSON.stringify({ error: "Failed to reject document" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
