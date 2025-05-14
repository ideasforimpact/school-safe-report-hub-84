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
      client_id 
    } = requestBody;
    
    console.log(`Received ${action} request`, { 
      documentId, 
      hasDocNumber: !!documentNumber, 
      hasTxnId: !!txnId, 
      hasOtp: !!otp,
      hasClientId: !!client_id
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set up production vs. sandbox environment for the Surepass API
    const environment = Deno.env.get("ENVIRONMENT") || "development";
    
    // Default base URL for Surepass API and API key - Use production directly
    let baseUrl = "https://kyc-api.surepass.io";
    let apiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY");
    
    // Check if we're testing in development mode
    const isDevTest = environment === "development" && !apiKey;

    // First, fetch the document_status to get the governance ID
    const { data: docStatus, error: statusError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'governance')
      .single();
    
    if (statusError) {
      console.error("Error fetching governance status:", statusError);
      return new Response(
        JSON.stringify({ error: "Could not find governance status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const governanceStatusId = docStatus?.id;
    console.log("Found governance status ID:", governanceStatusId);
    
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
      
      // For dev testing or when API key is not set, return a mock response
      if (isDevTest) {
        console.log("Development mode: Returning mock OTP response");
        
        // Update the document with current timestamp
        if (documentId) {
          await supabase
            .from('employee_documents')
            .update({ last_otp_generated: new Date().toISOString() })
            .eq('id', documentId);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Development mode: OTP would be sent to the registered mobile", 
            txnId: "dev-test-txn-" + Date.now(),
            client_id: "dev-test-client-" + Date.now()
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
            // Get existing logs
            const { data: document, error: docLogError } = await supabase
              .from('employee_documents')
              .select('employee_docs_log')
              .eq('id', documentId)
              .single();
            
            if (!docLogError) {
              const existingLogs = document?.employee_docs_log || [];
              
              // Create log entry for OTP generation
              const logEntry = {
                timestamp: new Date().toISOString(),
                action: "request_aadhar_otp",
                response: data
              };
              
              await supabase
                .from('employee_documents')
                .update({ 
                  last_otp_generated: new Date().toISOString(),
                  employee_docs_log: Array.isArray(existingLogs) ? [...existingLogs, logEntry] : [logEntry]
                })
                .eq('id', documentId);
            } else {
              // If can't get logs, just update the timestamp
              await supabase
                .from('employee_documents')
                .update({ last_otp_generated: new Date().toISOString() })
                .eq('id', documentId);
            }
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
      
      // For dev testing or when API key is not set, verify with simple mock logic
      if (isDevTest) {
        console.log("Development mode: Simulating OTP verification");
        
        // Simple verification - any 6-digit OTP where digits add up to a multiple of 5
        const isValidOtp = otp.length === 6 && 
          otp.split('').reduce((sum, digit) => sum + parseInt(digit), 0) % 5 === 0;
        
        if (!isValidOtp) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Invalid OTP. For dev testing, enter a 6-digit OTP where digits add up to a multiple of 5." 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Mock verification response for development
        const mockResponse = {
          success: true,
          message: "Development mode: OTP verification successful",
          data: {
            full_name: "Test User",
            aadhaar_number: "XXXX1234",
            dob: "1990-01-01",
            gender: "M",
            address: {
              country: "India",
              state: "Test State",
              district: "Test District"
            }
          }
        };
        
        if (documentId) {
          // First store the verification response in employee_docs_log
          const { data: document, error: fetchError } = await supabase
            .from('employee_documents')
            .select('employee_docs_log')
            .eq('id', documentId)
            .single();
            
          if (fetchError) {
            console.error("Error fetching document:", fetchError);
          } else {
            // Get existing logs or initialize empty array
            const existingLogs = document?.employee_docs_log || [];
            
            // Create log entry with timestamp and response data
            const logEntry = {
              timestamp: new Date().toISOString(),
              action: "verify_aadhar_otp",
              response: mockResponse
            };
            
            // Update document with log entry and verification status
            await supabase
              .from('employee_documents')
              .update({
                verification_status: 'verified',
                employee_docs_log: Array.isArray(existingLogs) ? [...existingLogs, logEntry] : [logEntry],
                document_status_id: governanceStatusId,
                updated_at: new Date().toISOString()
              })
              .eq('id', documentId);
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
                .update({ status: 'verified' })
                .eq('id', documentData.employee_id);
            }
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Development mode: OTP verification successful" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Actual API call to verify OTP
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
        
        // Check both data.success and response structure
        if (data && data.success === true) {
          console.log("Successful Aadhar verification detected, updating document status...");
          
          // Update document status to verified and store API response in logs
          if (documentId) {
            try {
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
                
                // Update document with verification status and log entry
                const { error: updateError } = await supabase
                  .from('employee_documents')
                  .update({
                    verification_status: 'verified',
                    employee_docs_log: Array.isArray(existingLogs) ? [...existingLogs, logEntry] : [logEntry],
                    document_status_id: governanceStatusId,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', documentId);
                  
                if (updateError) {
                  console.error("Error updating document with verification data:", updateError);
                } else {
                  console.log("Document updated successfully with verification status.");
                }
              }
              
              // Get employee ID from the document
              const { data: documentData } = await supabase
                .from('employee_documents')
                .select('employee_id')
                .eq('id', documentId)
                .single();
              
              if (documentData?.employee_id) {
                console.log("Checking if all employee documents are verified for employee:", documentData.employee_id);
                
                // Check if all employee documents are verified
                const { data: documents } = await supabase
                  .from('employee_documents')
                  .select('verification_status')
                  .eq('employee_id', documentData.employee_id);
                
                const allVerified = documents?.every(doc => doc.verification_status === 'verified');
                
                if (allVerified) {
                  console.log("All documents verified, updating employee status to verified.");
                  
                  await supabase
                    .from('employees')
                    .update({ status: 'verified' })
                    .eq('id', documentData.employee_id);
                } else {
                  console.log("Not all documents are verified yet.");
                }
              }
            } catch (updateError) {
              console.error("Error in database update after verification:", updateError);
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
          console.log("Verification failed, response did not indicate success.", data);
          
          // Even for failed verification, we should log the response
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
                  employee_docs_log: Array.isArray(existingLogs) ? [...existingLogs, logEntry] : [logEntry],
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
