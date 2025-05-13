
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
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Extract the body from the request
    const body = await req.json();
    const { action } = body;
    
    console.log(`Received request for action: ${action}`);
    
    if (action === 'request-aadhar-otp') {
      return await handleAadharOtpRequest(body, supabase, corsHeaders);
    } else if (action === 'verify-aadhar-otp') {
      return await handleAadharOtpVerify(body, supabase, corsHeaders);
    } else {
      return new Response(
        JSON.stringify({ error: `Invalid action: ${action}` }),
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
async function handleAadharOtpRequest(body, supabase, corsHeaders) {
  try {
    const { documentId, documentNumber } = body;
    
    console.log("Received OTP request:", { documentId, documentNumber });
    
    if (!documentId || !documentNumber) {
      return new Response(
        JSON.stringify({ error: "Document ID and Aadhar number are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the employee document entry that contains this document ID
    const { data: employeeDocs, error: fetchError } = await supabase
      .from('employee_documents')
      .select('*');
    
    if (fetchError) {
      console.error("Error fetching employee documents:", fetchError);
      throw fetchError;
    }
    
    // Find the employee and document matching this document ID
    let foundDocument = null;
    let employeeId = null;
    
    for (const empDoc of employeeDocs || []) {
      if (empDoc.documents && Array.isArray(empDoc.documents)) {
        const doc = empDoc.documents.find(d => d.id === documentId);
        if (doc) {
          foundDocument = doc;
          employeeId = empDoc.employee_id;
          break;
        }
      }
    }
    
    if (!foundDocument) {
      console.error("Document not found with ID:", documentId);
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Found document:", { id: foundDocument.id, type: foundDocument.documentTypeName });
    console.log("Employee ID:", employeeId);
    
    // Verify document is pending verification
    if (foundDocument.verificationStatus !== 'pending') {
      return new Response(
        JSON.stringify({ error: "This document is already verified or verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check OTP cooldown period (3 minutes)
    const { data: employeeDoc } = await supabase
      .from('employee_documents')
      .select('last_otp_generated')
      .eq('employee_id', employeeId)
      .single();
      
    const lastOtpGenerated = employeeDoc?.last_otp_generated;
    
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

    // In a real implementation, call the Aadhar API
    // For this demo, we'll simulate a successful OTP request
    
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a transaction ID
    const txnId = crypto.randomUUID();
    
    // Update the last_otp_generated timestamp
    const { error: updateError } = await supabase
      .from('employee_documents')
      .update({ 
        last_otp_generated: new Date().toISOString()
      })
      .eq('employee_id', employeeId);
    
    if (updateError) {
      console.error("Error updating last OTP timestamp:", updateError);
    }
    
    // Add a log entry
    const { data: currentDoc } = await supabase
      .from('employee_documents')
      .select('employee_docs_log')
      .eq('employee_id', employeeId)
      .single();
    
    const logEntry = {
      action: 'request_otp',
      documentId: documentId,
      timestamp: new Date().toISOString(),
      details: {
        txn_id: txnId
      }
    };
    
    const updatedLogs = [...(currentDoc?.employee_docs_log || []), logEntry];
    
    await supabase
      .from('employee_documents')
      .update({ 
        employee_docs_log: updatedLogs 
      })
      .eq('employee_id', employeeId);
    
    console.log("OTP request processed successfully for document ID:", documentId);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "OTP sent to registered mobile number",
        txnId,
        documentId
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
async function handleAadharOtpVerify(body, supabase, corsHeaders) {
  try {
    const { documentId, otp } = body;
    
    console.log("Received OTP verification:", { documentId, otp: otp ? "****" : null });
    
    if (!documentId || !otp) {
      return new Response(
        JSON.stringify({ error: "Document ID and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Find the employee document entry that contains this document ID
    const { data: employeeDocs, error: fetchError } = await supabase
      .from('employee_documents')
      .select('*');
    
    if (fetchError) {
      console.error("Error fetching employee documents:", fetchError);
      throw fetchError;
    }
    
    // Find the employee and document matching this document ID
    let foundDocument = null;
    let employeeId = null;
    let employeeDocEntry = null;
    
    for (const empDoc of employeeDocs || []) {
      if (empDoc.documents && Array.isArray(empDoc.documents)) {
        const doc = empDoc.documents.find(d => d.id === documentId);
        if (doc) {
          foundDocument = doc;
          employeeId = empDoc.employee_id;
          employeeDocEntry = empDoc;
          break;
        }
      }
    }
    
    if (!foundDocument || !employeeId || !employeeDocEntry) {
      console.error("Document not found with ID:", documentId);
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Found document for verification:", { id: foundDocument.id, type: foundDocument.documentTypeName });
    
    // Verify OTP is within the 3-minute window
    const lastOtpGenerated = employeeDocEntry.last_otp_generated;
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
    const logs = employeeDocEntry.employee_docs_log || [];
    const lastOtpRequestLog = [...logs]
      .reverse()
      .find(log => log.action === 'request_otp' && log.documentId === documentId);
    
    if (!lastOtpRequestLog || !lastOtpRequestLog.details?.txn_id) {
      return new Response(
        JSON.stringify({ error: "Missing transaction information, please request a new OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // In a real implementation, verify the OTP with the Aadhar API
    // For this demo, we'll simulate OTP verification
    
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demonstration, accept any 6-digit OTP where the digits add up to a multiple of 5
    const otpSum = otp.split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    const isValidOtp = otpSum % 5 === 0;
    
    if (!isValidOtp) {
      console.error("Invalid OTP submitted:", otp);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid OTP. Please try again." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Update document status to verified
    const updatedDocuments = employeeDocEntry.documents.map(doc => {
      if (doc.id === documentId) {
        console.log("Updating document status to verified:", documentId);
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
      documentId: documentId,
      timestamp: new Date().toISOString(),
      status: 'verified',
      method: 'api',
      notes: 'Verified via Aadhar OTP'
    };
    
    const updatedLogs = [...(employeeDocEntry.employee_docs_log || []), verificationLogEntry];
    
    // Update the database
    const { error: updateError } = await supabase
      .from('employee_documents')
      .update({ 
        documents: updatedDocuments,
        employee_docs_log: updatedLogs,
        verification_status: 'verified'
      })
      .eq('employee_id', employeeId);
    
    if (updateError) {
      console.error("Error updating document status:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update document verification status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("OTP verification successful for document ID:", documentId);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Aadhar verification completed successfully",
        documentId
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
