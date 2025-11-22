
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

// Helper function to generate UUID
function generateUUID(): string {
  // Generate UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to normalize QuickEKYC response to Surepass format
function normalizeQuickEKYCResponse(response: any, isOtpRequest: boolean): any {
  if (isOtpRequest) {
    // Normalize OTP request response
    if (response.status_code === 200 && response.status === 'success') {
      const generatedTxnId = generateUUID();
      const clientId = response.request_id?.toString() || null;
      return {
        success: true,
        message: response.message || "OTP sent successfully",
        data: {
          txn_id: generatedTxnId,
          client_id: clientId
        },
        txn_id: generatedTxnId,
        client_id: clientId
      };
    } else {
      // Error response
      return {
        success: false,
        message: response.message || "Verification failed",
        status_code: response.status_code,
        data: response.data || {}
      };
    }
  } else {
    // Normalize OTP verification response
    if (response.status_code === 200 && response.status === 'success') {
      // QuickEKYC response structure matches Surepass, so return as-is but ensure success flag
      return {
        success: true,
        status_code: 200,
        message: response.message || "Aadhar OTP verified. Awaiting approval.",
        data: response.data || {}
      };
    } else {
      // Error response - check for special cases
      // Handle case where status_code is 200 but status is 'error'
      if (response.status_code === 200 && response.status === 'error') {
        return {
          success: false,
          status_code: 200,
          message: response.message || "Invalid request",
          data: response.data || {}
        };
      }
      // Handle timeout/verification failed cases
      return {
        success: false,
        status_code: response.status_code,
        message: response.message || "Verification failed",
        data: response.data || {}
      };
    }
  }
}

// Helper function to convert technical API errors to user-friendly messages
const getUserFriendlyErrorMessage = (apiResponse: any, statusCode?: number, isQuickEKYCProvider: boolean = false): string => {
  // Handle QuickEKYC specific errors
  if (isQuickEKYCProvider) {
    const message = apiResponse?.message || '';
    const responseStatusCode = apiResponse?.status_code;
    
    if (message.includes('Aadhaar number is invalid') || message.includes('invalid')) {
      return 'Please enter a valid 12-digit Aadhaar number';
    }
    
    if (message.includes('OTP timed out') || message.includes('timeout')) {
      return 'The OTP has expired. Please request a new one';
    }
    
    if (message.includes('Verification Failed') || message.includes('verification')) {
      return 'Verification failed. Please check your details and try again';
    }
    
    if (responseStatusCode === 422) {
      return message || 'Verification failed. Please check your details and try again';
    }
    
    if (responseStatusCode === 500) {
      return 'Service temporarily unavailable. Please try again later';
    }
    
    if (responseStatusCode === 200 && apiResponse?.status === 'error') {
      return message || 'Invalid request. Please try again';
    }
    
    return message || 'Verification failed. Please check your details and try again';
  }
  
  // Handle Surepass API specific errors
  if (apiResponse?.data?.valid_aadhaar === false || apiResponse?.message?.includes('invalid_aadhaar')) {
    return 'Please enter a valid 12-digit Aadhaar number';
  }
  
  if (apiResponse?.message?.includes('aadhaar_not_found')) {
    return 'This Aadhaar number is not found in government records';
  }
  
  if (apiResponse?.message?.includes('otp_expired') || apiResponse?.message?.includes('otp_timeout')) {
    return 'The OTP has expired. Please request a new one';
  }
  
  if (apiResponse?.message?.includes('invalid_otp') || apiResponse?.message?.includes('wrong_otp')) {
    return 'Please enter the correct 6-digit OTP';
  }
  
  if (apiResponse?.message?.includes('verification_failed')) {
    return 'Verification failed. Please check your details and try again';
  }
  
  if (apiResponse?.message?.includes('already_verified')) {
    return 'This document has already been verified';
  }
  
  if (apiResponse?.message?.includes('rate_limit')) {
    return 'Too many requests. Please wait a moment and try again';
  }
  
  // Handle HTTP status codes
  if (statusCode === 429) {
    return 'Too many requests. Please wait a moment and try again';
  }
  
  if (statusCode === 401) {
    return 'Authentication failed. Please try again';
  }
  
  if (statusCode === 403) {
    return 'Access denied. Please contact support';
  }
  
  if (statusCode === 404) {
    return 'Service not found. Please contact support';
  }
  
  if (statusCode >= 500) {
    return 'Service temporarily unavailable. Please try again later';
  }
  
  // Default fallback for any other errors
  return 'Verification failed. Please check your details and try again';
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
      otp, 
      txnId,
      client_id,
      verification_notes,
      reject_reason,
      verified_by_employee_id
    } = requestBody;
    
    console.log(`Received ${action} request`, { 
      documentId, 
      hasDocNumber: !!documentNumber, 
      hasTxnId: !!txnId, 
      hasOtp: !!otp,
      hasClientId: !!client_id,
      hasVerificationNotes: !!verification_notes,
      documentNumber
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set up provider configuration for Aadhar actions
    let baseUrl: string | null = null;
    let apiKey: string | null = null;
    let generateOtpEndpoint = "/api/v1/aadhaar-v2/generate-otp";
    let submitOtpEndpoint = "/api/v1/aadhaar-v2/submit-otp";
    
    // Override baseUrl and apiKey for specific actions
    if (action === 'requestAadharOtp' || action === 'verifyAadharOtp') {
      if (isQuickEKYC) {
        // QuickEKYC configuration
        baseUrl = Deno.env.get("QUICKEKYC_BASE_ENDPOINT") || '';
        apiKey = Deno.env.get("QUICKEKYC_API_KEY_PROD") || '';
        // Endpoints remain the same for QuickEKYC
        generateOtpEndpoint = "/api/v1/aadhaar-v2/generate-otp";
        submitOtpEndpoint = "/api/v1/aadhaar-v2/submit-otp";
        console.log(`Using QuickEKYC API for ${action}: ${baseUrl}`);
      } else {
        // Surepass configuration
        baseUrl = Deno.env.get("SUREPASS_PRODUCTION_BASE_URL") || '';
        apiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || '';
        generateOtpEndpoint = "/api/v1/aadhaar-v2/generate-otp";
        submitOtpEndpoint = "/api/v1/aadhaar-v2/submit-otp";
        console.log(`Using Surepass API for ${action}: ${baseUrl}`);
      }
    }
    
    // First, fetch document status IDs for governance, manual and rejected statuses
    console.log("Fetching document status IDs");
    
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
    
    console.log("Found status IDs:", {
      governance: governanceStatusId,
      manual: manualStatusId,
      rejected: rejectedStatusId
    });
    
    // Handle manual verification
    if (action === 'manualVerify') {
      if (!documentId) {
        console.error("Missing required field: documentId for manual verification");
        return new Response(
          JSON.stringify({ error: "Document ID is required for manual verification" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        console.log(`Processing manual verification for document ID: ${documentId}`);
        
        // First fetch the current logs
        const { data: document, error: fetchError } = await supabase
          .from('employee_documents')
          .select('employee_docs_log, employee_id')
          .eq('id', documentId)
          .single();
          
        if (fetchError) {
          console.error("Error fetching document for manual verification:", fetchError);
          return new Response(
            JSON.stringify({ error: "Failed to fetch document data" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Get existing logs or initialize empty array
        const existingLogs = document?.employee_docs_log || [];
        const employeeId = document?.employee_id;
        
        if (!employeeId) {
          console.error("Document does not have an associated employee ID");
          return new Response(
            JSON.stringify({ error: "Document does not have an associated employee ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Create log entry with timestamp
        const logEntry = {
          timestamp: new Date().toISOString(),
          action: "manual_verification",
          response: {
            status: "verified",
            notes: verification_notes || "Document manually verified by staff."
          }
        };
        
        console.log("Updating document with manual verification status and log entry");
        console.log("Using manual status ID:", manualStatusId);
        
        // Update document with verification status, log entry, and manual status ID
        const { data: updateData, error: updateError } = await supabase
          .from('employee_documents')
          .update({
            verification_status: 'verified',
            employee_docs_log: [...existingLogs, logEntry],
            document_status_id: manualStatusId, // Use manual status ID
            verified_by: verified_by_employee_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId)
          .select();
          
        if (updateError) {
          console.error("Error updating document with manual verification:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update document with verification data" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log("Manual verification successful. Updated document:", updateData);
        
        // Check if all documents are verified for this employee
        const { data: employeeDocs, error: docsError } = await supabase
          .from('employee_documents')
          .select('verification_status')
          .eq('employee_id', employeeId);
        
        if (docsError) {
          console.error("Error fetching employee documents:", docsError);
        } else {
          const allVerified = employeeDocs?.every(doc => doc.verification_status === 'verified');
          
          if (allVerified) {
            console.log("All documents verified for employee:", employeeId);
            console.log("Updating employee status to true");
            
            const { error: employeeError } = await supabase
              .from('employees')
              .update({ status: true })
              .eq('id', employeeId);
              
            if (employeeError) {
              console.error("Error updating employee status:", employeeError);
            } else {
              console.log("Employee status updated to verified");
            }
          }
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Document manually verified successfully",
            status: "verified",
            documentId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
        
      } catch (err) {
        console.error("Exception in manual verification:", err);
        return new Response(
          JSON.stringify({ error: "Internal server error during manual verification" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Approve after API verification (Aadhaar flow)
    if (action === 'approveAfterApi') {
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: "Document ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!verified_by_employee_id) {
        return new Response(
          JSON.stringify({ error: "Employee ID is required for approval" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      try {
        // Fetch current logs
        const { data: document } = await supabase
          .from('employee_documents')
          .select('employee_docs_log')
          .eq('id', documentId)
          .single();
        const existingLogs = document?.employee_docs_log || [];

        const logEntry = {
          timestamp: new Date().toISOString(),
          action: 'approve_after_api',
          notes: verification_notes || 'Approved after Aadhaar API check',
          verified_by: verified_by_employee_id
        };

        await supabase
          .from('employee_documents')
          .update({
            verification_status: 'verified',
            document_status_id: governanceStatusId,
            verified_by: verified_by_employee_id,
            employee_docs_log: [...existingLogs, logEntry],
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to approve document' }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Handle Aadhar OTP request
    if (action === 'requestAadharOtp') {
      // Check if document has had an OTP generated recently
      if (documentId) {
        const { data: document, error: docError } = await supabase
          .from('employee_documents')
          .select('last_otp_generated')
          .eq('id', documentId)
          .single();
        
        if (docError) {
          console.error("Error fetching document:", docError);
        } else if (document?.last_otp_generated) {
          const lastOtpTime = new Date(document.last_otp_generated);
          const currentTime = new Date();
          // Calculate time difference in minutes
          const timeDiffMinutes = (currentTime.getTime() - lastOtpTime.getTime()) / (1000 * 60);
          console.log("Current time:", currentTime.toISOString());
          console.log("Last OTP time:", lastOtpTime.toISOString());
          console.log("Time difference since last OTP (minutes):", timeDiffMinutes);
          
          // OTP validity period: 3 minutes
          const OTP_VALIDITY_MINUTES = 3;
          
          // If it's been less than 3 minutes, OTP is still valid
          if (timeDiffMinutes < OTP_VALIDITY_MINUTES) {
            // Calculate remaining validity time in seconds
            const remainingSeconds = Math.ceil((OTP_VALIDITY_MINUTES - timeDiffMinutes) * 60);
            console.log(`OTP still valid. ${remainingSeconds} seconds remaining for use.`);
            
            return new Response(
              JSON.stringify({ 
                error: "OTP already sent and still valid", 
                cooldownRemaining: remainingSeconds,
                otpStatus: "valid" 
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            console.log("Previous OTP has expired, allowing new OTP request");
          }
        }
      }
      
      if (!baseUrl || !apiKey) {
        return new Response(
          JSON.stringify({ error: "API configuration not found" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        if (!documentNumber) {
          return new Response(
            JSON.stringify({ error: "Document number is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const apiUrl = `${baseUrl}${generateOtpEndpoint}`;
        console.log(`Making request to ${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API to generate OTP with base URL:`, apiUrl);
        
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
        
        const rawData = await response.json();
        console.log(`${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API response:`, JSON.stringify(rawData));
        
        // Normalize QuickEKYC response to Surepass format
        const data = isQuickEKYC ? normalizeQuickEKYCResponse(rawData, true) : rawData;
        
        // Handle API success case
        if (data.success) {
          // Update document with timestamp of OTP generation
          if (documentId) {
            await supabase
              .from('employee_documents')
              .update({ last_otp_generated: new Date().toISOString() })
              .eq('id', documentId);
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: data.message || "OTP sent successfully", 
              txnId: data.data?.txn_id || data.txn_id,
              client_id: data.data?.client_id || data.client_id
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // Log the technical error for debugging
          console.error(`${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API error:`, rawData);
          
          // Check if error status_code exists (QuickEKYC error format)
          // If status_code exists and is not 200, don't show details popup
          const hasErrorStatusCode = rawData.status_code && rawData.status_code !== 200;
          
          // Return user-friendly error message with 200 status to ensure frontend can access it
          const userFriendlyMessage = getUserFriendlyErrorMessage(rawData, response.status, isQuickEKYC);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: userFriendlyMessage,
              status_code: hasErrorStatusCode ? rawData.status_code : undefined
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.error(`Error calling ${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API:`, error);
        return new Response(
          JSON.stringify({ success: false, error: "Unable to connect to verification service. Please try again later" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Handle Aadhar OTP verification
    else if (action === 'verifyAadharOtp') {
      // Only require OTP - txnId is now optional
      if (!otp) {
        console.error("Missing required field: OTP");
        return new Response(
          JSON.stringify({ error: "OTP is required" }),
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
        const apiUrl = `${baseUrl}${submitOtpEndpoint}`;
        console.log(`Making request to ${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API to verify OTP with base URL:`, apiUrl);
        
        // Prepare request headers and body based on provider
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        // Only add Bearer token for Surepass, not for QuickEKYC
        if (!isQuickEKYC) {
          requestHeaders['Authorization'] = `Bearer ${apiKey}`;
        }
        
        const requestBody: any = isQuickEKYC
          ? { otp, key: apiKey }
          : { otp };
        
        // Add txn_id if provided (for Surepass)
        if (!isQuickEKYC && txnId) {
          requestBody.txn_id = txnId;
        }
        
        // Add client_id/request_id if provided
        if (isQuickEKYC && client_id) {
          // For QuickEKYC, we use request_id instead of client_id
          requestBody.request_id = client_id;
        } else if (!isQuickEKYC && client_id) {
          requestBody.client_id = client_id;
        }
        
        console.log("Submit OTP request body:", requestBody);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody)
        });
        
        const rawData = await response.json();
        console.log(`${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API verification response:`, JSON.stringify(rawData));
        
        // Normalize QuickEKYC response to Surepass format
        const data = isQuickEKYC ? normalizeQuickEKYCResponse(rawData, false) : rawData;
        
        // Check status_code in API response
        if (data.success && data.status_code === 200) {
          // Persist API response meta for faster UI rendering; do NOT auto-approve
          if (documentId) {
            const { data: document } = await supabase
              .from('employee_documents')
              .select('employee_docs_log')
              .eq('id', documentId)
              .single();
            const existingLogs = document?.employee_docs_log || [];
            const logEntry = {
              timestamp: new Date().toISOString(),
              action: "verify_aadhar_otp",
              response: data
            };
            await supabase
              .from('employee_documents')
              .update({
                employee_docs_log: [...existingLogs, logEntry],
                api_response_data: data,
                api_verification_status: 'completed',
                api_verification_method: 'api',
                api_verification_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', documentId);
          }
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Aadhar OTP verified. Awaiting approval.",
              data
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          // Failed verification - update document with rejected status
          if (documentId) {
            // Fetch current logs
            const { data: document } = await supabase
              .from('employee_documents')
              .select('employee_docs_log')
              .eq('id', documentId)
              .single();
              
            if (document) {
              const existingLogs = document.employee_docs_log || [];
              
              // Log failed verification attempt
              const logEntry = {
                timestamp: new Date().toISOString(),
                action: "verify_aadhar_otp_failed",
                response: data
              };
              
              await supabase
                .from('employee_documents')
                .update({
                  employee_docs_log: [...existingLogs, logEntry],
                  document_status_id: rejectedStatusId,
                  verification_status: 'failed',
                  api_response_data: data,
                  api_verification_status: String(data?.status_code ?? rawData?.status_code ?? 'failed'),
                  api_verification_method: 'api',
                  api_verification_date: null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', documentId);
            }
          }
          
          // Log the technical error for debugging
          console.error("OTP verification failed:", rawData);
          
          // Check if error status_code exists (QuickEKYC error format)
          // If status_code exists and is not 200, don't show details popup
          const hasErrorStatusCode = rawData.status_code && rawData.status_code !== 200;
          
          // Return user-friendly error message with 200 status to ensure frontend can access it
          const userFriendlyMessage = getUserFriendlyErrorMessage(rawData, response.status, isQuickEKYC);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: userFriendlyMessage,
              status_code: hasErrorStatusCode ? rawData.status_code : undefined
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.error(`Error verifying OTP with ${isQuickEKYC ? 'QuickEKYC' : 'Surepass'} API:`, error);
        return new Response(
          JSON.stringify({ success: false, error: "Unable to connect to verification service. Please try again later" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Handle reject action
    if (action === 'reject') {
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: "Document ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        // Fetch current logs
        const { data: document } = await supabase
          .from('employee_documents')
          .select('employee_docs_log')
          .eq('id', documentId)
          .single();
          
        if (document) {
          const existingLogs = document.employee_docs_log || [];
          
          // Log rejection
          const logEntry = {
            timestamp: new Date().toISOString(),
            action: "manual_reject",
            response: { reason: reject_reason || "Document rejected" },
            notes: verification_notes
          };
          
          await supabase
            .from('employee_documents')
            .update({
              employee_docs_log: [...existingLogs, logEntry],
              document_status_id: rejectedStatusId,
              verification_status: 'failed',
              verified_by: null,
              reject_reason: reject_reason || "Document verification rejected",
              api_verification_date: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Document rejected successfully" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error rejecting document:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to reject document" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Handle manual verify action
    if (action === 'manualVerify') {
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: "Document ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      try {
        // Fetch current logs
        const { data: document } = await supabase
          .from('employee_documents')
          .select('employee_docs_log')
          .eq('id', documentId)
          .single();
          
        if (document) {
          const existingLogs = document.employee_docs_log || [];
          
          // Log manual verification
          const logEntry = {
            timestamp: new Date().toISOString(),
            action: "manual_verify",
            response: { status: "approved" },
            notes: verification_notes
          };
          
          await supabase
            .from('employee_documents')
            .update({
              employee_docs_log: [...existingLogs, logEntry],
              document_status_id: governanceStatusId,
              verification_status: 'verified',
              verified_by: verified_by_employee_id || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Document verified successfully" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error verifying document:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to verify document" }),
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
