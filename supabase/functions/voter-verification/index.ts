
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
      verification_notes
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
    
    // Handle API verification using Surepass
    if (action === 'apiVerify') {
      if (!documentNumber) {
        return new Response(
          JSON.stringify({ error: "Voter ID number is required for API verification" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        console.log("Making request to Surepass API to verify Voter ID with base URL:", baseUrl);
        
        // Make the API call to Surepass for Voter ID verification
        const response = await fetch(`${baseUrl}/api/v1/voter-id/voter-id`, {
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
          action: "verify_voter_id_api",
          response: data
        };
        
        // Check if API verification was successful (status_code 200)
        if (data.success && data.status_code === 200) {
          // Update document with verification status, API response in log, and governance status
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update({
              verification_status: 'verified',
              employee_docs_log: [...existingLogs, apiLogEntry],
              document_status_id: governanceStatusId,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
            
          if (updateError) {
            console.error("Error updating document with verification data:", updateError);
            return new Response(
              JSON.stringify({ error: "Failed to update document status" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Voter ID verification successful",
              status: "verified",
              statusId: governanceStatusId
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // Failed verification - update document with rejected status
          const apiLogEntry = {
            timestamp: new Date().toISOString(),
            action: "verify_voter_id_api_failed",
            response: data
          };
          
          await supabase
            .from('employee_documents')
            .update({
              employee_docs_log: [...existingLogs, apiLogEntry],
              document_status_id: rejectedStatusId,
              verification_status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: data.message || "Voter ID verification failed",
              status: "failed",
              statusId: rejectedStatusId
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.error("Error verifying Voter ID with Surepass API:", error);
        return new Response(
          JSON.stringify({ error: "Failed to connect to verification service" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    
    // Handle rejection
    else if (action === 'reject') {
      try {
        // Create log entry for rejection
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "reject_voter_id",
          notes: verification_notes || "Document verification rejected"
        };
        
        // Update document with rejected status
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'failed',
            employee_docs_log: [...existingLogs, logEntry],
            document_status_id: rejectedStatusId,
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
