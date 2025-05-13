
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
    const { action, documentId, documentNumber, otp, txnId } = await req.json();
    console.log(`Received ${action} request`, { documentId, hasDocNumber: !!documentNumber, hasTxnId: !!txnId, hasOtp: !!otp });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Set up production vs. sandbox environment for the Surepass API
    const environment = Deno.env.get("ENVIRONMENT") || "development";
    const apiKey = environment === "production" 
      ? Deno.env.get("SUREPASS_PRODUCTION_API_KEY") 
      : Deno.env.get("SUREPASS_SANDBOX_API_KEY");
    
    // Base URL for Surepass API
    const baseUrl = Deno.env.get("SUREPASS_BASE_URL") || "https://sandbox.surepass.io";
    
    // Check if we're testing in development mode
    const isDevTest = environment === "development" && !apiKey;
    
    // Handle Aadhar OTP request
    if (action === 'requestAadharOtp') {
      // Check if document has had an OTP generated in the last 15 minutes
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
          const timeDiff = (new Date().getTime() - lastOtpTime.getTime()) / (1000 * 60); // in minutes
          
          if (timeDiff < 15) {
            const cooldownRemaining = Math.ceil(15 - timeDiff);
            console.log(`Cooldown period active. ${cooldownRemaining} minutes remaining.`);
            
            return new Response(
              JSON.stringify({ 
                error: "Cooldown period active", 
                cooldownRemaining 
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
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
            txnId: "dev-test-txn-" + Date.now()
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
        
        console.log("Making request to Surepass API to generate OTP");
        
        const response = await fetch(`${baseUrl}/api/v1/aadhaar-v2/generate-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ aadhaar_number: documentNumber })
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
              txnId: data.data?.txn_id || data.txn_id
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
      if (!otp || !txnId) {
        return new Response(
          JSON.stringify({ error: "OTP and transaction ID are required" }),
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
        
        if (documentId) {
          await supabase
            .from('employee_documents')
            .update({
              verification_status: 'verified',
              verification_method: 'api',
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          
          // Get employee ID from the document
          const { data: document } = await supabase
            .from('employee_documents')
            .select('employee_id')
            .eq('id', documentId)
            .single();
          
          if (document?.employee_id) {
            // Check if all employee documents are verified
            const { data: documents } = await supabase
              .from('employee_documents')
              .select('verification_status')
              .eq('employee_id', document.employee_id);
            
            const allVerified = documents?.every(doc => doc.verification_status === 'verified');
            
            if (allVerified) {
              await supabase
                .from('employees')
                .update({ status: 'verified' })
                .eq('id', document.employee_id);
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
        console.log("Making request to Surepass API to verify OTP");
        
        const response = await fetch(`${baseUrl}/api/v1/aadhaar-v2/submit-otp`, {
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
        
        const data = await response.json();
        console.log("Surepass API verification response:", JSON.stringify(data));
        
        if (data.success) {
          // Update document status to verified
          if (documentId) {
            await supabase
              .from('employee_documents')
              .update({
                verification_status: 'verified',
                verification_method: 'api',
                updated_at: new Date().toISOString()
              })
              .eq('id', documentId);
            
            // Get employee ID from the document
            const { data: document } = await supabase
              .from('employee_documents')
              .select('employee_id')
              .eq('id', documentId)
              .single();
            
            if (document?.employee_id) {
              // Check if all employee documents are verified
              const { data: documents } = await supabase
                .from('employee_documents')
                .select('verification_status')
                .eq('employee_id', document.employee_id);
              
              const allVerified = documents?.every(doc => doc.verification_status === 'verified');
              
              if (allVerified) {
                await supabase
                  .from('employees')
                  .update({ status: 'verified' })
                  .eq('id', document.employee_id);
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
