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
    const { action, documentId } = requestBody;
    
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
    
    // Handle API verification
    if (action === 'apiVerify') {
      // First, get the document from the database to get the file URL and params
      const { data: document, error: docError } = await supabase
        .from('employee_documents')
        .select('document_url, employee_id, params')
        .eq('id', documentId)
        .single();
      
      if (docError || !document) {
        console.error("Error fetching document:", docError);
        return new Response(
          JSON.stringify({ error: "Document not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        // Extract account number and IFSC code from params
        const params = document.params || {};
        const accountNumber = params.accountNumber;
        const ifscCode = params.ifscCode;
        
        // Step 0: First verify the bank account details if IFSC details are requested
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
          
          // Check if bank verification was successful (status_code == 200)
          if (!verificationResult.success || verificationResult.status_code !== 200) {
            // Update document with failed status
            const { error: updateError } = await supabase
              .from('employee_documents')
              .update({
                verification_status: 'failed',
                document_status_id: statusMap[DOC_STATUS.REJECTED],
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
          
          // Bank verification was successful, now proceed with file upload
          console.log("Bank verification successful, proceeding with file upload");
          
          // Step 1: Download the file from Supabase storage
          console.log("Downloading file from 'employee-documents' storage bucket:", document.document_url);
          
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('employee-documents')
            .download(document.document_url);
          
          if (downloadError || !fileData) {
            console.error("Error downloading file from storage:", downloadError);
            throw new Error(`Failed to download file from storage: ${downloadError?.message || 'Unknown error'}`);
          }
          
          console.log("File downloaded successfully, size:", fileData.size);
          
          // Step 2: Convert the blob to ArrayBuffer
          const arrayBuffer = await fileData.arrayBuffer();
          console.log("Converted file to ArrayBuffer, size:", arrayBuffer.byteLength);
          
          // Step 3: Create FormData and append file with buffer data
          const formData = new FormData();
          
          // Extract filename from the path or use default
          const fileName = document.document_url.split('/').pop() || "bank_statement.pdf";
          
          // Create a File object with the array buffer data
          const file = new File([arrayBuffer], fileName, { type: "application/pdf" });
          formData.append('file', file);
          
          console.log("FormData created with file:", fileName);
          
          // Step 4: Call Surepass API with the FormData
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
          
          // Create log entry for the upload response with client_id
          const uploadLogEntry = {
            timestamp: new Date().toISOString(),
            action: "bank_statement_upload_api",
            response: uploadResult,
            client_id: uploadResult.data?.client_id
          };
          
          // Create verification log entry (without client_id)
          const verificationLogEntry = {
            timestamp: new Date().toISOString(),
            action: "bank_verification",
            response: verificationResult
          };
          
          // Combine both logs
          const combinedLogs = [verificationLogEntry, uploadLogEntry];
          
          // Check if upload was successful
          if (!uploadResult.success || uploadResult.status_code !== 200) {
            // Update document with failed status and logs
            const { error: updateError } = await supabase
              .from('employee_documents')
              .update({
                verification_status: 'failed',
                document_status_id: statusMap[DOC_STATUS.REJECTED],
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
                message: uploadResult.message || "Bank statement upload failed",
                status_code: uploadResult.status_code
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          // Upload successful - update document with in-progress status, logs, and activate cron
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update({
              verification_status: 'pending',
              document_status_id: statusMap[DOC_STATUS.PENDING],
              employee_docs_log: combinedLogs,
              cron_activate: true,
              cron_activated_date: new Date().toISOString(),
              cron_updated_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
            
          if (updateError) {
            console.error("Error updating document with upload success:", updateError);
          }
          
          console.log("Bank statement upload successful, cron job activated");
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Bank statement uploaded successfully, processing initiated",
              status_code: 200,
              client_id: uploadResult.data?.client_id
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
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
        
        // Update document with failed status
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'failed',
            document_status_id: statusMap[DOC_STATUS.REJECTED],
            employee_docs_log: [{
              timestamp: new Date().toISOString(),
              action: "bank_verification_error",
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
          document_status_id: statusMap[DOC_STATUS.MANUAL],
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
          document_status_id: statusMap[DOC_STATUS.REJECTED],
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
    // Handle cron job execution
    else if (action === 'cronJob') {
      return await handleCronJob(supabase, baseUrl, apiKey, statusMap);
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

/**
 * Handle cron job execution for bank statement downloads
 */
async function handleCronJob(supabase: any, baseUrl: string, apiKey: string, statusMap: Record<string, string>) {
  try {
    console.log("Starting cron job for bank statement verification");
    
    // Get only the latest document with cron_activate = true and document_type = "bank_account"
    // Order by cron_activated_date ASC to get the oldest first (FIFO processing)
    const { data: documents, error: fetchError } = await supabase
      .from('employee_documents')
      .select(`
        id,
        employee_id,
        employee_docs_log,
        cron_log,
        cron_activated_date,
        document_type:employee_document_type(name)
      `)
      .eq('cron_activate', true)
      .eq('employee_document_type.name', 'bank_account')
      .order('cron_activated_date', { ascending: true })
      .limit(1)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No data found
        console.log("No bank account documents with active cron found");
        return new Response(
          JSON.stringify({ success: true, message: "No documents to process" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("Error fetching cron documents:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch cron documents" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!documents) {
      console.log("No bank account documents with active cron found");
      return new Response(
        JSON.stringify({ success: true, message: "No documents to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Processing document ${documents.id} with cron_activated_date: ${documents.cron_activated_date}`);
    
    try {
      // Extract client_id from employee_docs_log
      const employeeDocsLog = Array.isArray(documents.employee_docs_log) ? documents.employee_docs_log : [];
      const clientId = employeeDocsLog.find((log: any) => log.client_id)?.client_id;
      
      if (!clientId) {
        console.log(`No client_id found for document ${documents.id}, skipping`);
        
        // Add log entry for missing client_id
        const cronLogEntry = {
          timestamp: new Date().toISOString(),
          action: "cron_bank_statement_download",
          status: "skipped",
          error: "No client_id found in employee_docs_log"
        };
        
        const existingCronLog = Array.isArray(documents.cron_log) ? documents.cron_log : [];
        await supabase
          .from('employee_documents')
          .update({
            cron_log: [...existingCronLog, cronLogEntry],
            cron_updated_date: new Date().toISOString()
          })
          .eq('id', documents.id);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Document skipped due to missing client_id",
            processed: 1,
            successful: 0
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log(`Processing document ${documents.id} with client_id: ${clientId}`);
      
      // Call the download API
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
      console.log(`Download API response for document ${documents.id}:`, downloadResult);
      
      // Create cron log entry
      const cronLogEntry = {
        timestamp: new Date().toISOString(),
        action: "cron_bank_statement_download",
        status: downloadResult.success ? "success" : "failed",
        details: downloadResult
      };
      
      const existingCronLog = Array.isArray(documents.cron_log) ? documents.cron_log : [];
      
      // Update document based on download result
      if (downloadResult.success && downloadResult.status_code === 200) {
        // Verification complete - update to verified status and deactivate cron
        await supabase
          .from('employee_documents')
          .update({
            verification_status: 'verified',
            document_status_id: statusMap[DOC_STATUS.VERIFIED],
            cron_activate: false,
            cron_log: [...existingCronLog, cronLogEntry],
            cron_updated_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', documents.id);
        
        console.log(`Document ${documents.id} verified successfully`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Document verified successfully",
            processed: 1,
            successful: 1
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (downloadResult.success && downloadResult.status_code === 202) {
        // Still processing - just update cron log
        await supabase
          .from('employee_documents')
          .update({
            cron_log: [...existingCronLog, cronLogEntry],
            cron_updated_date: new Date().toISOString()
          })
          .eq('id', documents.id);
        
        console.log(`Document ${documents.id} still processing`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Document still processing",
            processed: 1,
            successful: 0
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Failed - update to failed status and deactivate cron
        await supabase
          .from('employee_documents')
          .update({
            verification_status: 'failed',
            document_status_id: statusMap[DOC_STATUS.REJECTED],
            cron_activate: false,
            cron_log: [...existingCronLog, cronLogEntry],
            cron_updated_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', documents.id);
        
        console.log(`Document ${documents.id} verification failed`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Document verification failed",
            processed: 1,
            successful: 0
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
    } catch (error) {
      console.error(`Error processing document ${documents.id}:`, error);
      
      // Add error log entry
      const cronLogEntry = {
        timestamp: new Date().toISOString(),
        action: "cron_bank_statement_download",
        status: "error",
        error: error.message
      };
      
      const existingCronLog = Array.isArray(documents.cron_log) ? documents.cron_log : [];
      await supabase
        .from('employee_documents')
        .update({
          cron_log: [...existingCronLog, cronLogEntry],
          cron_updated_date: new Date().toISOString()
        })
        .eq('id', documents.id);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Error processing document",
          processed: 1,
          successful: 0,
          error: error.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
  } catch (error) {
    console.error("Error in cron job:", error);
    return new Response(
      JSON.stringify({ error: "Cron job failed", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
