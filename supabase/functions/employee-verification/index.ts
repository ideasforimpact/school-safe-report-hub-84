
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
      otp, 
      txnId,
      client_id,
      verification_notes 
    } = requestBody;
    
    console.log(`Received ${action} request`, { 
      documentId, 
      hasDocNumber: !!documentNumber, 
      hasTxnId: !!txnId, 
      hasOtp: !!otp,
      hasClientId: !!client_id,
      hasVerificationNotes: !!verification_notes
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set up production vs. sandbox environment for the Surepass API
    const environment = Deno.env.get("ENVIRONMENT") || "development";
    
    // Default base URL for Surepass API and API key
    let baseUrl = environment === "production" 
      ? Deno.env.get("SUREPASS_BASE_URL") || "https://sandbox.surepass.io"
      : "https://sandbox.surepass.io";
    
    let apiKey = environment === "production" 
      ? Deno.env.get("SUREPASS_PRODUCTION_API_KEY") 
      : Deno.env.get("SUREPASS_SANDBOX_API_KEY");
    
    // Override baseUrl and apiKey for specific actions
    if (action === 'requestAadharOtp' || action === 'verifyAadharOtp') {
      // For these specific actions, always use production URL and key
      baseUrl = "https://kyc-api.surepass.io";
      apiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY");
      
      console.log(`Using production API for ${action}: ${baseUrl}`);
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
      
      try {
        // Actual API call to Surepass
        if (!documentNumber) {
          return new Response(
            JSON.stringify({ error: "Document number is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log("Making request to Surepass API to generate OTP with base URL:", baseUrl);
        
        const response = await fetch(`${baseUrl}/api/v1/aadhaar-v2/generate-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ id_number: documentNumber })
        });
        
        const data = await response.json();
        console.log("Surepass API response:", JSON.stringify(data));
        
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
          return new Response(
            JSON.stringify({ error: data.message || "Failed to generate OTP" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.error("Error calling Surepass API:", error);
        return new Response(
          JSON.stringify({ error: "Failed to connect to verification service" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      
      try {
        console.log("Making request to Surepass API to verify OTP with base URL:", baseUrl);
        
        const requestBody: any = {
          otp
        };
        
        // Add txn_id if provided
        if (txnId) {
          requestBody.txn_id = txnId;
        }
        
        // Add client_id if provided
        if (client_id) {
          requestBody.client_id = client_id;
        }
        
        console.log("Submit OTP request body:", requestBody);
        
        const response = await fetch(`${baseUrl}/api/v1/aadhaar-v2/submit-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        console.log("Surepass API verification response:", JSON.stringify(data));
        
        // Check status_code in API response
        if (data.success && data.status_code === 200) {
          // Update document status to verified and store API response in logs
          if (documentId) {
            // First fetch the current logs
            const { data: document, error: fetchError } = await supabase
              .from('employee_documents')
              .select('employee_docs_log')
              .eq('id', documentId)
              .single();
              
            if (fetchError) {
              console.error("Error fetching document for logging:", fetchError);
            } else {
              // Get existing logs or initialize empty array
              const existingLogs = document?.employee_docs_log || [];
              
              // Create log entry with timestamp and API response
              const logEntry = {
                timestamp: new Date().toISOString(),
                action: "verify_aadhar_otp",
                response: data
              };
              
              // Update document with verification status, log entry and governance status
              const { error: updateError } = await supabase
                .from('employee_documents')
                .update({
                  verification_status: 'verified',
                  employee_docs_log: [...existingLogs, logEntry],
                  document_status_id: governanceStatusId,
                  updated_at: new Date().toISOString()
                })
                .eq('id', documentId);
                
              if (updateError) {
                console.error("Error updating document with verification data:", updateError);
              }
            }
            
            // Get employee ID from the document
            const { data: documentData } = await supabase
              .from('employee_documents')
              .select('employee_id')
              .eq('id', documentId)
              .single();
            
            if (documentData?.employee_id) {
              // Check if all employee documents are verified
              const { data: documents } = await supabase
                .from('employee_documents')
                .select('verification_status')
                .eq('employee_id', documentData.employee_id);
              
              const allVerified = documents?.every(doc => doc.verification_status === 'verified');
              
              if (allVerified) {
                await supabase
                  .from('employees')
                  .update({ status: true })
                  .eq('id', documentData.employee_id);
              }
            }
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Aadhar verification successful" 
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
                  updated_at: new Date().toISOString()
                })
                .eq('id', documentId);
            }
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: data.message || "OTP verification failed" 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.error("Error verifying OTP with Surepass API:", error);
        return new Response(
          JSON.stringify({ error: "Failed to connect to verification service" }),
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
