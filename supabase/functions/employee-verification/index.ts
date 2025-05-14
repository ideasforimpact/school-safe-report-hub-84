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

  // Initialize environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const surepassApiKey = Deno.env.get("SUREPASS_SANDBOX_API_KEY") || "";
  const productionApiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || "";
  const environment = Deno.env.get("ENVIRONMENT") || "development";

  // For Aadhar verification, always use production
  const aadharApiKey = productionApiKey || surepassApiKey;
  const aadharBaseUrl = "https://kyc-api.surepass.io";

  // For other verifications (like PAN), use environment-based configuration
  const panApiKey = environment === "production" 
    ? productionApiKey 
    : surepassApiKey;
  const panBaseUrl = "https://kyc-api.surepass.io";

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action } = body || {};

    console.log(`Processing ${action} request`);

    if (action === 'requestAadharOtp') {
      // Always use production for Aadhar
      return await handleAadharOtpRequest(body, aadharBaseUrl, aadharApiKey, supabase, corsHeaders);
    }
    else if (action === 'verifyAadharOtp') {
      // Always use production for Aadhar
      return await handleAadharOtpVerify(body, aadharBaseUrl, aadharApiKey, supabase, corsHeaders);
    }
    else if (action === 'verifyPanCard') {
      // Use environment-specific configuration for PAN
      return await handlePanVerification(body, panBaseUrl, panApiKey, supabase, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleAadharOtpRequest(body, baseUrl, apiKey, supabase, corsHeaders) {
  const { documentId, documentNumber } = body;
  
  if (!documentNumber || !documentId) {
    return new Response(
      JSON.stringify({ error: "Document ID and Aadhar number are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  try {
    // Check if we're in a cooldown period for this document
    const { data: docData, error: docError } = await supabase
      .from('employee_documents')
      .select('last_otp_generated')
      .eq('id', documentId)
      .single();
    
    if (docError) {
      throw new Error("Failed to retrieve document: " + docError.message);
    }
    
    if (docData.last_otp_generated) {
      // Calculate time elapsed since last OTP
      const lastOtpTime = new Date(docData.last_otp_generated).getTime();
      const currentTime = new Date().getTime();
      const elapsedSeconds = Math.floor((currentTime - lastOtpTime) / 1000);
      
      // If less than 2 minutes have passed, enforce a cooldown
      if (elapsedSeconds < 120) {
        const cooldownRemaining = 120 - elapsedSeconds;
        return new Response(
          JSON.stringify({ 
            error: "Please wait before requesting another OTP", 
            cooldownRemaining 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Call the Surepass API to generate OTP
    const response = await fetch(`${baseUrl}/api/v1/aadhaar-v2/generate-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ aadhaar_number: documentNumber })
    });
    
    const responseData = await response.json();
    console.log("Surepass OTP response:", responseData);
    
    // Update last OTP generated timestamp
    await supabase
      .from('employee_documents')
      .update({ 
        last_otp_generated: new Date().toISOString(),
        employee_docs_log: supabase.rpc('append_to_json_array', { 
          arr: docData.employee_docs_log || [], 
          new_element: {
            timestamp: new Date().toISOString(),
            action: "aadhar_otp_requested",
            response: { success: responseData.success || false }
          }
        })
      })
      .eq('id', documentId);
    
    if (!responseData.success) {
      return new Response(
        JSON.stringify({ 
          error: responseData.message || "Failed to generate OTP",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        txnId: responseData.data?.client_id || responseData.data?.txn_id,
        client_id: responseData.data?.client_id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in handleAadharOtpRequest:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to request OTP" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function handleAadharOtpVerify(body, baseUrl, apiKey, supabase, corsHeaders) {
  const { documentId, otp, txnId, client_id } = body;
  
  if (!documentId || !otp) {
    return new Response(
      JSON.stringify({ error: "Document ID and OTP are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get document to retrieve document number if needed
    const { data: docData, error: docError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (docError) {
      throw new Error("Failed to retrieve document: " + docError.message);
    }
    
    // Call the Surepass API to verify OTP
    const reqBody: any = { otp };
    
    // Add transaction ID if available
    if (txnId) {
      reqBody.txn_id = txnId;
    }
    
    // Add client ID if available
    if (client_id) {
      reqBody.client_id = client_id;
    }
    
    const response = await fetch(`${baseUrl}/api/v1/aadhaar-v2/submit-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(reqBody)
    });
    
    const responseData = await response.json();
    console.log("Surepass OTP verification response:", responseData);
    
    if (!responseData.success) {
      // Log the failed verification attempt
      await supabase
        .from('employee_documents')
        .update({ 
          employee_docs_log: supabase.rpc('append_to_json_array', { 
            arr: docData.employee_docs_log || [], 
            new_element: {
              timestamp: new Date().toISOString(),
              action: "aadhar_verification_failed",
              response: { 
                message: responseData.message || "Verification failed" 
              }
            }
          })
        })
        .eq('id', documentId);
        
      return new Response(
        JSON.stringify({ 
          error: responseData.message || "Failed to verify OTP",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the governance document status ID for successful verification
    const { data: governanceStatus, error: statusError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'governance')
      .maybeSingle();
      
    if (statusError) {
      throw new Error("Failed to get document status: " + statusError.message);
    }
    
    const governanceStatusId = governanceStatus?.id;
    
    // Update document verification status
    await supabase
      .from('employee_documents')
      .update({ 
        verification_status: 'verified',
        document_status_id: governanceStatusId,
        employee_docs_log: supabase.rpc('append_to_json_array', { 
          arr: docData.employee_docs_log || [], 
          new_element: {
            timestamp: new Date().toISOString(),
            action: "aadhar_verification_success",
            response: { 
              method: "api",
              data: responseData.data || {}
            }
          }
        })
      })
      .eq('id', documentId);
      
    // Check and update employee status if needed
    await updateEmployeeVerificationStatus(docData.employee_id, supabase);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Aadhar verification completed successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in handleAadharOtpVerify:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to verify OTP" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function handlePanVerification(body, baseUrl, apiKey, supabase, corsHeaders) {
  const { documentId, documentNumber } = body;
  
  if (!documentNumber || !documentId) {
    return new Response(
      JSON.stringify({ error: "Document ID and PAN number are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  try {
    console.log("Verifying PAN card:", documentNumber);
    
    // Get document to access logs
    const { data: docData, error: docError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (docError) {
      throw new Error("Failed to retrieve document: " + docError.message);
    }
    
    // Call the Surepass API to verify PAN
    const response = await fetch(`${baseUrl}/api/v1/pan/pan-comprehensive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ id_number: documentNumber })
    });
    
    const responseData = await response.json();
    console.log("Surepass PAN verification response:", responseData);
    
    if (!responseData.success) {
      // Log the failed verification attempt
      await supabase
        .from('employee_documents')
        .update({ 
          employee_docs_log: supabase.rpc('append_to_json_array', { 
            arr: docData.employee_docs_log || [], 
            new_element: {
              timestamp: new Date().toISOString(),
              action: "pan_verification_failed",
              response: { 
                message: responseData.message || "Verification failed" 
              }
            }
          })
        })
        .eq('id', documentId);
        
      return new Response(
        JSON.stringify({ 
          error: responseData.message || "Failed to verify PAN",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the governance document status ID for successful verification
    const { data: governanceStatus, error: statusError } = await supabase
      .from('document_status')
      .select('id')
      .eq('name', 'governance')
      .maybeSingle();
      
    if (statusError) {
      throw new Error("Failed to get document status: " + statusError.message);
    }
    
    const governanceStatusId = governanceStatus?.id;
    
    // Extract relevant data
    const verificationData = responseData.data || {};
    
    // Update document verification status
    await supabase
      .from('employee_documents')
      .update({ 
        verification_status: 'verified',
        document_status_id: governanceStatusId,
        employee_docs_log: supabase.rpc('append_to_json_array', { 
          arr: docData.employee_docs_log || [], 
          new_element: {
            timestamp: new Date().toISOString(),
            action: "pan_verification_success",
            response: { 
              method: "api",
              data: verificationData
            }
          }
        }),
        // Store extracted details
        details: {
          name: verificationData.name,
          panStatus: verificationData.status,
          category: verificationData.category,
          lastUpdated: verificationData.last_updated
        }
      })
      .eq('id', documentId);
      
    // Check and update employee status if needed
    await updateEmployeeVerificationStatus(docData.employee_id, supabase);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "PAN verification completed successfully",
        details: {
          name: verificationData.name,
          status: verificationData.status,
          category: verificationData.category,
          lastUpdated: verificationData.last_updated
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in handlePanVerification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to verify PAN" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function updateEmployeeVerificationStatus(employeeId, supabase) {
  try {
    // Get all documents for this employee
    const { data: docs, error: docsError } = await supabase
      .from('employee_documents')
      .select('verification_status')
      .eq('employee_id', employeeId);
      
    if (docsError) {
      throw new Error("Failed to retrieve employee documents: " + docsError.message);
    }
    
    // Determine overall status
    let overallStatus = 'pending';
    const allVerified = docs.every(doc => doc.verification_status === 'verified');
    const anyFailed = docs.some(doc => doc.verification_status === 'failed');
    
    if (anyFailed) {
      overallStatus = 'failed';
    } else if (allVerified) {
      overallStatus = 'verified';
    }
    
    // Update employee status
    await supabase
      .from('employees')
      .update({ status: overallStatus })
      .eq('id', employeeId);
      
    return overallStatus;
  } catch (error) {
    console.error("Error updating employee verification status:", error);
    throw error;
  }
}
