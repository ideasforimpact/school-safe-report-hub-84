// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const body = await req.json();
    const { action, documentId, verification_notes, verified_by_employee_id, reject_reason } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const environment = Deno.env.get("ENVIRONMENT") || "development";
    const baseUrl = environment === 'production'
      ? Deno.env.get("SUREPASS_PRODUCTION_BASE_URL") || "https://kyc-api.surepass.io"
      : "https://sandbox.surepass.io";
    const apiKey = environment === 'production'
      ? Deno.env.get("SUREPASS_PRODUCTION_API_KEY")
      : Deno.env.get("SUREPASS_SANDBOX_API_KEY");

    // Status ids
    const fetchStatusId = async (name: string) => {
      const { data, error } = await supabase.from('document_status').select('id').eq('name', name).single();
      if (error) throw error;
      return data?.id as string;
    };

    const governanceStatusId = await fetchStatusId('governance');
    const rejectedStatusId = await fetchStatusId('rejected');
    const manualStatusId = await fetchStatusId('manual');

    if (action === 'apiVerify') {
      if (!documentId) {
        return new Response(JSON.stringify({ error: 'Document ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: document, error: docError } = await supabase
        .from('employee_documents')
        .select('document_number, params, employee_docs_log')
        .eq('id', documentId)
        .single();
      if (docError || !document) {
        return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const fileNumber = document.document_number; // passport file number
      const dob = document.params?.DOB;
      const existingLogs = document.employee_docs_log || [];

      if (!fileNumber || !dob) {
        return new Response(JSON.stringify({ error: 'File number and DOB are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      try {
        const response = await fetch(`${baseUrl}/api/v1/passport/passport/passport-details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ id_number: fileNumber, dob })
        });

        const apiResponse = await response.json();

        // Always append a log entry
        const logEntry = { timestamp: new Date().toISOString(), action: 'verify_passport_api', response: apiResponse };

        // On success (status_code 200), persist api_* columns and keep verification pending
        if (apiResponse?.success && apiResponse?.status_code === 200) {
          await supabase.from('employee_documents').update({
            verification_status: 'pending',
            employee_docs_log: [...existingLogs, logEntry],
            api_response_data: apiResponse,
            api_verification_status: 'completed',
            api_verification_method: 'api',
            api_verification_date: new Date().toISOString()
          }).eq('id', documentId);
        } else {
          // Failure path: mark API attempt and store response
          await supabase.from('employee_documents').update({
            employee_docs_log: [...existingLogs, logEntry],
            api_response_data: apiResponse,
            api_verification_status: 'failed',
            api_verification_method: 'api',
            api_verification_date: new Date().toISOString()
          }).eq('id', documentId);
        }

        return new Response(JSON.stringify({ success: true, data: apiResponse }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (error: any) {
        await supabase.from('employee_documents').update({
          employee_docs_log: [...(document.employee_docs_log || []), { timestamp: new Date().toISOString(), action: 'verify_passport_api_error', response: { error: error.message } }],
          api_verification_status: 'failed',
          api_verification_method: 'api',
          api_verification_date: new Date().toISOString()
        }).eq('id', documentId);

        return new Response(JSON.stringify({ error: error.message || 'Passport API verification failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (action === 'manualVerify') {
      if (!documentId) {
        return new Response(JSON.stringify({ error: 'Document ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: existing, error: docError } = await supabase.from('employee_documents').select('employee_docs_log').eq('id', documentId).single();
      const logs = existing?.employee_docs_log || [];

      await supabase.from('employee_documents').update({
        document_status_id: governanceStatusId,
        verification_status: 'verified',
        verified_by: verified_by_employee_id || null,
        employee_docs_log: [...logs, { timestamp: new Date().toISOString(), action: 'verify_passport_manual', notes: verification_notes || 'Document manually verified by staff.' }]
      }).eq('id', documentId);

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'reject') {
      if (!documentId) {
        return new Response(JSON.stringify({ error: 'Document ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: existing, error: docError } = await supabase.from('employee_documents').select('employee_docs_log').eq('id', documentId).single();
      const logs = existing?.employee_docs_log || [];

      await supabase.from('employee_documents').update({
        document_status_id: rejectedStatusId,
        verification_status: 'failed',
        reject_reason: reject_reason || 'Document verification rejected by staff.',
        employee_docs_log: [...logs, { timestamp: new Date().toISOString(), action: 'reject_passport', notes: reject_reason || 'Document verification rejected by staff.' }]
      }).eq('id', documentId);

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


