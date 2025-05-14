
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
  const environment = Deno.env.get("ENVIRONMENT") || "development";
  
  // Default API configuration based on environment - using fixed values as requested
  let apiKey, baseUrl;
  
  // Using fixed values for baseUrl and apiKey as requested by the user
  baseUrl = "https://kyc-api.surepass.io";
  apiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || "";

  // Log environment variables (masking sensitive parts)
  console.log("Environment variables check:");
  console.log(`SUPABASE_URL: ${supabaseUrl ? "✓ Set" : "✗ Not set"}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? "✓ Set" : "✗ Not set"}`);
  console.log(`ENVIRONMENT: ${environment}`);
  console.log(`Using API Key: ${apiKey ? "✓ Set" : "✗ Not set"} (${environment} environment)`);
  console.log(`Using Base URL: ${baseUrl}`);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action } = body || {};

    console.log(`Processing ${action} request`);

    // For Aadhar verification, always use production settings regardless of environment
    if (action === 'requestAadharOtp' || action === 'verifyAadharOtp') {
      const aadharApiKey = Deno.env.get("SUREPASS_PRODUCTION_API_KEY") || apiKey;
      const aadharBaseUrl = Deno.env.get("SUREPASS_PRODUCTION_BASE_URL") || "https://kyc-api.surepass.io";
      
      console.log("Using production settings for Aadhar verification:");
      console.log(`Aadhar API Key: ${aadharApiKey ? "✓ Set" : "✗ Not set"}`);
      console.log(`Aadhar Base URL: ${aadharBaseUrl}`);
      
      if (action === 'requestAadharOtp') {
        return await handleAadharOtpRequest(body, aadharBaseUrl, aadharApiKey, supabase, corsHeaders);
      }
      else if (action === 'verifyAadharOtp') {
        return await handleAadharOtpVerify(body, aadharBaseUrl, aadharApiKey, supabase, corsHeaders);
      }
    }
    else if (action === 'verifyPanCard') {
      // Use environment-specific settings for PAN (already set in apiKey and baseUrl)
      console.log(`Using ${environment} settings for PAN verification`);
      return await handlePanVerification(body, baseUrl, apiKey, supabase, corsHeaders);
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
    console.log(`Using Base URL: ${baseUrl}`);
    
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
    const apiEndpoint = `${baseUrl}/api/v1/pan/pan-comprehensive`;
    console.log(`Calling PAN verification API endpoint: ${apiEndpoint}`);
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ id_number: documentNumber })
    });
    
    // Log the raw response status and headers for debugging
    console.log("API Response status:", response.status);
    console.log("API Response headers:", Object.fromEntries(response.headers.entries()));
    
    // Check if response is OK (200-299)
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorText;
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } else {
        errorText = await response.text();
        // If error response contains HTML, extract a more user-friendly message
        if (errorText.includes('<html>')) {
          errorText = `Server returned HTML response instead of JSON. Status: ${response.status}`;
        }
      }
      
      console.error("API Error response:", errorText);
      
      // Log the error to the document logs
      await logErrorToDocument(supabase, documentId, docData, {
        action: "pan_verification_api_error",
        status: response.status,
        error: errorText.substring(0, 500) // Limit the size of the error text
      });
      
      throw new Error(`API returned status ${response.status}: ${errorText.substring(0, 100)}...`);
    }
    
    // Handle the response body
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const textResponse = await response.text();
      console.error("Received non-JSON response:", textResponse);
      
      // Log the non-JSON response to document logs
      await logErrorToDocument(supabase, documentId, docData, {
        action: "pan_verification_invalid_response",
        error: "Received non-JSON response",
        response: textResponse.substring(0, 500) // Limit the size
      });
      
      throw new Error("API returned non-JSON response");
    }
    
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
  } catch (err) {
    console.error("Error in handlePanVerification:", err);
    
    // Try to log the error in the document logs
    try {
      if (documentId) {
        const { data } = await supabase
          .from('employee_documents')
          .select('employee_docs_log')
          .eq('id', documentId)
          .single();
          
        if (data) {
          await supabase
            .from('employee_documents')
            .update({ 
              employee_docs_log: supabase.rpc('append_to_json_array', { 
                arr: data.employee_docs_log || [], 
                new_element: {
                  timestamp: new Date().toISOString(),
                  action: "pan_verification_error",
                  response: { 
                    error: err.message || "Unknown error during verification"
                  }
                }
              })
            })
            .eq('id', documentId);
        }
      }
    } catch (logError) {
      console.error("Failed to log error to document logs:", logError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: err.message || "Failed to verify PAN",
        details: "There was a problem with the verification service. Please try again later."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function logErrorToDocument(supabase, documentId, docData, errorDetails) {
  try {
    if (!documentId) return;
    
    await supabase
      .from('employee_documents')
      .update({ 
        employee_docs_log: supabase.rpc('append_to_json_array', { 
          arr: docData.employee_docs_log || [], 
          new_element: {
            timestamp: new Date().toISOString(),
            ...errorDetails
          }
        })
      })
      .eq('id', documentId);
      
  } catch (error) {
    console.error("Failed to log error to document:", error);
  }
}
