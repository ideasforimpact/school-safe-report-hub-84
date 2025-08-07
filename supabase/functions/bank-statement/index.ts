import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// CORS headers setup
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Document status constants
const DOC_STATUS = {
  PENDING: 'in-progress',
  VERIFIED: 'governance',
  REJECTED: 'rejected',
  MANUAL: 'manual'
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
    const { action, documentId, verification_notes } = requestBody;
    
    console.log(`Bank Statement Verification: Received ${action} request for document ID: ${documentId}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check environment to determine which API keys and URLs to use
    const environment = Deno.env.get("ENVIRONMENT") || "production";
    
    // Use the appropriate base URL and API key based on environment
    const baseUrl = environment === "development" 
      ? Deno.env.get("SUREPASS_BASE_URL") || "https://sandbox.surepass.io"
      : Deno.env.get("SUREPASS_PRODUCTION_BASE_URL") || "https://kyc-api.surepass.io";
    
    const apiKey = environment === "development"
      ? Deno.env.get("SUREPASS_SANDBOX_API_KEY") || ""
      : Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || "";
    
    console.log(`Bank Statement Verification: Using ${environment} environment with base URL: ${baseUrl}`);
    
    // Fetch all document statuses once
    const { data: documentStatuses, error: statusError } = await supabase
      .from('document_status')
      .select('id, name')
      .in('name', [DOC_STATUS.PENDING, DOC_STATUS.VERIFIED, DOC_STATUS.REJECTED, DOC_STATUS.MANUAL]);
    
    if (statusError) {
      console.error("Error fetching document statuses:", statusError);
      return new Response(
        JSON.stringify({ error: "Could not fetch document statuses" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Map status names to IDs
    const statusMap = documentStatuses.reduce((acc, status) => {
      acc[status.name] = status.id;
      return acc;
    }, {});
    
    console.log("Bank Statement Verification: Found status IDs:", statusMap);
    
    // Handle API verification - NEW BEHAVIOR
    if (action === 'apiVerify') {
      // First, get the document from the database to get the file URL and params
      const { data: document, error: docError } = await supabase
        .from('employee_documents')
        .select('document_url, employee_id, params, employee_docs_log')
        .eq('id', documentId)
        .single();
      
      if (docError || !document) {
        console.error("Error fetching document:", docError);
        return new Response(
          JSON.stringify({ error: "Document not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const existingLogs = document?.employee_docs_log || [];

      try {
        // Extract account number and IFSC code from params
        const params = document.params || {};
        const accountNumber = params.accountNumber;
        const ifscCode = params.ifscCode;
        
        // Verify the bank account details if IFSC details are requested
        if (params["ifsc-details"] && accountNumber && ifscCode) {
          console.log("Verifying bank account details with IFSC:", ifscCode, "Account:", accountNumber);
          
          // Call the bank verification API with the correct payload format
          const verificationResponse = await fetch(`${baseUrl}/api/v1/bank-verification/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id_number: accountNumber,
              ifsc: ifscCode,
              ifsc_details: true
            })
          });
          
          const verificationResult = await verificationResponse.json();
          console.log("Bank Verification API Response:", verificationResult);
          
          // Create verification log entry
          const verificationLogEntry = {
            timestamp: new Date().toISOString(),
            action: "bank_verification",
            response: verificationResult
          };
          
          // NEW BEHAVIOR: Always store API response and keep status as pending
          // Only set to failed if API call completely failed
          if (verificationResult.success && verificationResult.status_code === 200) {
            // API Success: Store response in api_response_data, keep status pending
            const { error: updateError } = await supabase
              .from('employee_documents')
              .update({
                api_response_data: verificationResult,
                api_verification_status: 'completed',
                api_verification_method: 'api',
                api_verification_date: new Date().toISOString(),
                employee_docs_log: [...existingLogs, verificationLogEntry],
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
                message: "Bank statement API verification completed. Please review the response.",
                requiresReview: true
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            // API Failure: Set status to failed immediately
            const { error: updateError } = await supabase
              .from('employee_documents')
              .update({
                verification_status: 'failed',
                document_status_id: statusMap[DOC_STATUS.REJECTED],
                employee_docs_log: [...existingLogs, verificationLogEntry],
                api_verification_status: 'failed',
                api_verification_method: 'api',
                api_verification_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', documentId);
              
            if (updateError) {
              console.error("Error updating document with failed status:", updateError);
            }
            
            return new Response(
              JSON.stringify({ 
                success: false, 
                message: verificationResult.message || "Bank verification failed",
                status_code: verificationResult.status_code
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Missing required parameters: accountNumber, ifscCode, or ifsc-details flag" 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
        
      } catch (error) {
        console.error("Error verifying bank statement:", error);
        
        // API call failed completely - set to failed status
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'failed',
            document_status_id: statusMap[DOC_STATUS.REJECTED],
            employee_docs_log: [...existingLogs, {
              timestamp: new Date().toISOString(),
              action: "bank_verification_error",
              response: { error: error.message }
            }],
            api_verification_status: 'failed',
            api_verification_method: 'api',
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
          
        if (updateError) {
          console.error("Error updating document with failed status:", updateError);
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: error.message || "Error occurred while verifying bank statement" 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // Handle manual verification
    else if (action === 'manualVerify') {
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
          action: "verify_bank_statement_manual",
          notes: verification_notes || "Document manually verified by staff."
        };
        
        // Update document with manually verified status
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'verified',
            document_status_id: statusMap[DOC_STATUS.MANUAL],
            employee_docs_log: [...existingLogs, logEntry],
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
          
        if (updateError) {
          console.error("Error updating document with manual verification:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update document" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Document manually verified" 
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
    // Handle rejection
    else if (action === 'reject') {
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
          action: "reject_bank_statement",
          notes: verification_notes || "Document verification rejected by staff."
        };
        
        // Update document with rejected status
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'failed',
            document_status_id: statusMap[DOC_STATUS.REJECTED],
            employee_docs_log: [...existingLogs, logEntry],
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
          
        if (updateError) {
          console.error("Error rejecting document:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to reject document" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Document verification rejected" 
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
