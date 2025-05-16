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

// Max retry attempts for checking document status
const MAX_RETRY_ATTEMPTS = 10;
const RETRY_DELAY_MS = 3000; // 3 seconds between retries

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
      
      try {
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
              document_status_id: statusMap[DOC_STATUS.REJECTED],
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
        
        // Step 5: Get client_id from upload response and call the download API
        const clientId = uploadResult.data?.client_id;
        if (!clientId) {
          throw new Error("Client ID not found in upload response");
        }
        
        // First update document status to "in-progress"
        const { error: pendingUpdateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'pending',
            document_status_id: statusMap[DOC_STATUS.PENDING],
            employee_docs_log: [uploadLogEntry],
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        
        if (pendingUpdateError) {
          console.error("Error updating document with pending status:", pendingUpdateError);
        }
        
        // Start background processing
        EdgeRuntime.waitUntil(
          processDocumentVerification(
            baseUrl,
            apiKey,
            clientId,
            documentId,
            statusMap,
            supabase,
            document.employee_id,
            uploadLogEntry
          )
        );
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Bank statement verification in progress",
            status_code: 202
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
 * Process document verification with retries
 */
async function processDocumentVerification(
  baseUrl: string,
  apiKey: string,
  clientId: string,
  documentId: string,
  statusMap: Record<string, string>,
  supabase: any,
  employeeId: string,
  uploadLogEntry: any
) {
  let attempts = 0;
  let isProcessingComplete = false;
  
  while (!isProcessingComplete && attempts < MAX_RETRY_ATTEMPTS) {
    attempts++;
    
    try {
      console.log(`Processing attempt ${attempts} for client ID: ${clientId}`);
      
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
      console.log("Bank Statement Download API Response:", downloadResult);
      
      // Create log entry for the download response
      const downloadLogEntry = {
        timestamp: new Date().toISOString(),
        action: "bank_statement_download_api",
        response: downloadResult
      };
      
      // Combine logs
      const combinedLogs = [uploadLogEntry, downloadLogEntry];
      
      // Check download result
      if (downloadResult.success) {
        if (downloadResult.status_code === 200) {
          // Processing complete - update document with verified status
          const { error: updateError } = await supabase
            .from('employee_documents')
            .update({
              verification_status: 'verified',
              document_status_id: statusMap[DOC_STATUS.VERIFIED],
              employee_docs_log: combinedLogs,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
            
          if (updateError) {
            console.error("Error updating document with verified status:", updateError);
          } else {
            console.log(`Document ${documentId} verified successfully`);
          }
          
          isProcessingComplete = true;
          break;
        } 
        else if (downloadResult.status_code === 202 && 
                downloadResult.message_code === "pending_document") {
          // Document still processing - keep the in-progress status
          console.log(`Document ${documentId} still processing. Will retry in ${RETRY_DELAY_MS}ms`);
          
          // Update logs but keep the pending status
          const { error: updateLogError } = await supabase
            .from('employee_documents')
            .update({
              employee_docs_log: combinedLogs,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
            
          if (updateLogError) {
            console.error("Error updating document logs:", updateLogError);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        } 
        else {
          // Unexpected status - update document with failed status
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
          
          isProcessingComplete = true;
          break;
        }
      } 
      else {
        // API error - update document with failed status
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
        
        isProcessingComplete = true;
        break;
      }
    } 
    catch (error) {
      console.error(`Error in verification attempt ${attempts}:`, error);
      
      // If we've reached max attempts, mark as failed
      if (attempts >= MAX_RETRY_ATTEMPTS) {
        const { error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'failed',
            document_status_id: statusMap[DOC_STATUS.REJECTED],
            employee_docs_log: [{
              timestamp: new Date().toISOString(),
              action: "bank_statement_download_error",
              response: { error: error.message, attempts }
            }],
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
          
        if (updateError) {
          console.error("Error updating document with failed status after max retries:", updateError);
        }
      } 
      else {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
  
  // If we've exited the loop without completing, it means we've reached max attempts
  if (!isProcessingComplete) {
    console.log(`Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached for document ${documentId}`);
    
    // Update document with failed status
    const { error: updateError } = await supabase
      .from('employee_documents')
      .update({
        verification_status: 'failed',
        document_status_id: statusMap[DOC_STATUS.REJECTED],
        employee_docs_log: [{
          timestamp: new Date().toISOString(),
          action: "bank_statement_max_retries",
          response: { error: "Max retry attempts reached", attempts }
        }],
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
      
    if (updateError) {
      console.error("Error updating document with failed status after max retries:", updateError);
    }
  }
}
