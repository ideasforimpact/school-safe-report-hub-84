
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// CORS headers
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

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const action = pathParts[pathParts.length - 1];
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (action === 'request-aadhar-otp') {
      return await handleAadharOtpRequest(req, supabase, corsHeaders);
    } else if (action === 'verify-aadhar-otp') {
      return await handleAadharOtpVerify(req, supabase, corsHeaders);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Handle Aadhar OTP request
async function handleAadharOtpRequest(req: Request, supabase, corsHeaders) {
  try {
    const { documentId, documentNumber } = await req.json();
    
    console.log("Received OTP request:", { documentId, documentNumber });
    
    if (!documentId || !documentNumber) {
      return new Response(
        JSON.stringify({ error: "Document ID and Aadhar number are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get document information to verify it exists and has pending status
    const { data: employeeDoc, error: docError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (docError || !employeeDoc) {
      console.error("Error fetching employee document:", docError);
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Found employee document:", employeeDoc);
    
    // Find the matching document in the documents array
    const documents = employeeDoc.documents || [];
    const document = documents.find(doc => doc.documentTypeName === 'aadhar');
    
    if (!document) {
      console.error("Aadhar document not found in documents array");
      return new Response(
        JSON.stringify({ error: "Aadhar document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verify document is pending verification
    if (document.verificationStatus !== 'pending') {
      return new Response(
        JSON.stringify({ error: "This document is already verified or verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check OTP cooldown period (3 minutes)
    const lastOtpGenerated = employeeDoc.last_otp_generated;
    if (lastOtpGenerated) {
      const lastOtpTime = new Date(lastOtpGenerated).getTime();
      const currentTime = new Date().getTime();
      const timeDiff = (currentTime - lastOtpTime) / 1000 / 60; // in minutes
      
      if (timeDiff < 3) {
        return new Response(
          JSON.stringify({ 
            error: "Please wait before requesting another OTP",
            cooldownRemaining: Math.ceil(3 - timeDiff)
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get SurePass API keys and URL from environment variables
    const apiKey = Deno.env.get("SUREPASS_API_KEY") || "";
    const baseUrl = Deno.env.get("SUREPASS_BASE_URL") || "https://kyc-api.surepass.io";
    
    if (!apiKey || !baseUrl) {
      console.error("Missing SurePass API configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the SurePass API to request OTP - use the plain document number from the request
    console.log("Calling SurePass API to generate OTP");
    const surepassResponse = await fetch(`${baseUrl}/api/v1/aadhaar-v2/generate-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ 
        aadhaar_number: documentNumber // Use the plain document number directly
      })
    });
    
    const surepassData = await surepassResponse.json();
    console.log("SurePass API response:", surepassData);
    
    if (!surepassResponse.ok || !surepassData.success) {
      console.error("SurePass API error:", surepassData);
      return new Response(
        JSON.stringify({ 
          error: surepassData.message || "Failed to request OTP from verification provider" 
        }),
        { status: surepassResponse.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Update the last_otp_generated timestamp
    const { error: updateError } = await supabase
      .from('employee_documents')
      .update({ 
        last_otp_generated: new Date().toISOString()
      })
      .eq('id', employeeDoc.id);
    
    if (updateError) {
      console.error("Error updating last OTP timestamp:", updateError);
    }
    
    // Add a log entry
    const logEntry = {
      action: 'request_otp',
      documentId: document.id,
      timestamp: new Date().toISOString(),
      details: {
        client_id: surepassData.data?.client_id || '',
        txn_id: surepassData.data?.txn_id || ''
      }
    };
    
    const updatedLogs = [...(employeeDoc.employee_docs_log || []), logEntry];
    
    await supabase
      .from('employee_documents')
      .update({ 
        employee_docs_log: updatedLogs 
      })
      .eq('id', employeeDoc.id);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "OTP sent to registered mobile number",
        data: {
          client_id: surepassData.data?.client_id,
          txn_id: surepassData.data?.txn_id
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in handleAadharOtpRequest:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle Aadhar OTP verification
async function handleAadharOtpVerify(req: Request, supabase, corsHeaders) {
  try {
    const { documentId, otp } = await req.json();
    
    if (!documentId || !otp) {
      return new Response(
        JSON.stringify({ error: "Document ID and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get document information and verify OTP cooldown period
    const { data: employeeDoc, error: docError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (docError || !employeeDoc) {
      console.error("Error fetching document:", docError);
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Find the matching document in the documents array
    const documents = employeeDoc.documents || [];
    const document = documents.find(doc => doc.documentTypeName === 'aadhar');
    
    if (!document) {
      return new Response(
        JSON.stringify({ error: "Aadhar document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verify OTP is within the 3-minute window
    const lastOtpGenerated = employeeDoc.last_otp_generated;
    if (!lastOtpGenerated) {
      return new Response(
        JSON.stringify({ error: "No OTP was requested for this document" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const lastOtpTime = new Date(lastOtpGenerated).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = (currentTime - lastOtpTime) / 1000 / 60; // in minutes
    
    if (timeDiff > 3) {
      return new Response(
        JSON.stringify({ error: "OTP has expired, please request a new one" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the transaction ID from the logs
    const logs = employeeDoc.employee_docs_log || [];
    const lastOtpRequestLog = [...logs]
      .reverse()
      .find(log => log.action === 'request_otp');
    
    if (!lastOtpRequestLog || !lastOtpRequestLog.details?.txn_id) {
      return new Response(
        JSON.stringify({ error: "Missing transaction information, please request a new OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const txnId = lastOtpRequestLog.details.txn_id;
    
    // Get SurePass API keys and URL from environment variables
    const apiKey = Deno.env.get("SUREPASS_API_KEY") || "";
    const baseUrl = Deno.env.get("SUREPASS_BASE_URL") || "https://kyc-api.surepass.io";
    
    if (!apiKey || !baseUrl) {
      console.error("Missing SurePass API configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the SurePass API to verify OTP
    const surepassResponse = await fetch(`${baseUrl}/api/v1/aadhaar-v2/submit-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ 
        otp,
        txn_id: txnId
      })
    });
    
    const surepassData = await surepassResponse.json();
    
    if (!surepassResponse.ok || !surepassData.success) {
      console.error("SurePass API error:", surepassData);
      return new Response(
        JSON.stringify({ 
          error: surepassData.message || "Failed to verify OTP" 
        }),
        { status: surepassResponse.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Update document status to verified
    const updatedDocuments = documents.map(doc => {
      if (doc.documentTypeName === 'aadhar') {
        return {
          ...doc,
          verificationStatus: 'verified',
          verificationMethod: 'api',
          verificationDate: new Date().toISOString(),
          verificationNotes: 'Verified via Aadhar OTP'
        };
      }
      return doc;
    });
    
    // Add verification log entry
    const verificationLogEntry = {
      action: 'verify',
      documentId: document.id,
      timestamp: new Date().toISOString(),
      status: 'verified',
      method: 'api',
      notes: 'Verified via Aadhar OTP',
      details: {
        verification_data: surepassData.data || {}
      }
    };
    
    const updatedLogs = [...(employeeDoc.employee_docs_log || []), verificationLogEntry];
    
    // Update the database
    const { error: updateError } = await supabase
      .from('employee_documents')
      .update({ 
        documents: updatedDocuments,
        employee_docs_log: updatedLogs,
        verification_status: 'verified'
      })
      .eq('id', employeeDoc.id);
    
    if (updateError) {
      console.error("Error updating document status:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update document verification status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
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
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
