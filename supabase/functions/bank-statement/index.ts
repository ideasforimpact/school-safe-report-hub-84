
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
    const { action, documentId } = requestBody;
    
    console.log(`Bank Statement Verification: Received ${action} request for document ID: ${documentId}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Use production values directly
    const baseUrl = "https://kyc-api.surepass.io";
    const apiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || "";
    
    console.log(`Bank Statement Verification: Using production environment with base URL: ${baseUrl}`);
    
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
    
    console.log("Bank Statement Verification: Found status IDs:", {
      governanceStatusId,
      manualStatusId,
      rejectedStatusId
    });
    
    // Handle API verification
    if (action === 'apiVerify') {
      // First, get the document from the database to get the file URL
      const { data: document, error: docError } = await supabase
        .from('employee_documents')
        .select('document_url, employee_id')
        .eq('id', documentId)
        .single();
      
      if (docError || !document) {
        console.error("Error fetching document:", docError);
        return new Response(
          JSON.stringify({ error: "Document not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Bank Statement Verification: Found document with URL:", document.document_url);
      
      try {
        // Step 1: First fetch the actual PDF file from the document URL
        console.log("Fetching PDF file from URL:", document.document_url);
        const fileResponse = await fetch(document.document_url);
        
        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch PDF file: ${fileResponse.status} ${fileResponse.statusText}`);
        }
        
        // Get the file content as blob
        const fileBlob = await fileResponse.blob();
        console.log("File fetched successfully, size:", fileBlob.size, "type:", fileBlob.type);
        
        // Create FormData and append the actual file
        const formData = new FormData();
        
        // Create a File object from the blob with a filename
        const fileName = document.document_url.split('/').pop() || "bank_statement.pdf";
        const file = new File([fileBlob], fileName, { type: "application/pdf" });
        
        formData.append('file', file);
        console.log("FormData created with file:", fileName);
        
        // Call the upload API with the actual file
        console.log("Calling bank statement upload API...");
        const uploadResponse = await fetch(`${baseUrl}/api/v1/bank/statement/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        console.log("Bank Statement Upload API Response:", uploadResult);
        
        // Create log entry for the upload response
        const uploadLogEntry = {
          timestamp: new Date().toISOString(),
          action: "bank_statement_upload_api",
          response: uploadResult
        };
        
        // Check if upload was successful
        if (!uploadResult.success || uploadResult.status_code !== 200) {
          // Update document with failed status and log
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update({
              verification_status: 'failed',
              document_status_id: rejectedStatusId,
              employee_docs_log: [uploadLogEntry],
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
            
          if (updateError) {
            console.error("Error updating document with failed status:", updateError);
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: uploadResult.message || "Bank statement upload failed",
              status_code: uploadResult.status_code
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Step 2: Get client_id and call the download API
        const clientId = uploadResult.data?.client_id;
        if (!clientId) {
          throw new Error("Client ID not found in upload response");
        }
        
        const downloadResponse = await fetch(`${baseUrl}/api/v1/bank/statement/download`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: clientId
          })
        });
        
        const downloadResult = await downloadResponse.json();
        console.log("Bank Statement Download API Response:", downloadResult);
        
        // Create log entry for the download response
        const downloadLogEntry = {
          timestamp: new Date().toISOString(),
          action: "bank_statement_download_api",
          response: downloadResult
        };
        
        // Combine logs
        const combinedLogs = [uploadLogEntry, downloadLogEntry];
        
        // Check if download was successful
        if (downloadResult.success && downloadResult.status_code === 200) {
          // Update document with verified status and log
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update({
              verification_status: 'verified',
              document_status_id: governanceStatusId,
              employee_docs_log: combinedLogs,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
            
          if (updateError) {
            console.error("Error updating document with verified status:", updateError);
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Bank statement verified successfully",
              status_code: 200
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // Update document with failed status and log
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update({
              verification_status: 'failed',
              document_status_id: rejectedStatusId,
              employee_docs_log: combinedLogs,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
            
          if (updateError) {
            console.error("Error updating document with failed status:", updateError);
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: downloadResult.message || "Bank statement download failed",
              status_code: downloadResult.status_code
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
      } catch (error) {
        console.error("Error verifying bank statement:", error);
        
        // Update document with failed status
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'failed',
            document_status_id: rejectedStatusId,
            employee_docs_log: [{
              timestamp: new Date().toISOString(),
              action: "bank_statement_api_error",
              response: { error: error.message }
            }],
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
      // Update document with manually verified status
      const { error: updateError } = await supabase
        .from('employee_documents')
        .update({
          verification_status: 'verified',
          document_status_id: manualStatusId,
          employee_docs_log: [],
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
    }
    // Handle rejection
    else if (action === 'reject') {
      // Update document with rejected status
      const { error: updateError } = await supabase
        .from('employee_documents')
        .update({
          verification_status: 'failed',
          document_status_id: rejectedStatusId,
          employee_docs_log: [],
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
