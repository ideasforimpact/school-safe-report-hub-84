import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseAnonKey } from '../_shared/env.ts'
import { logVerificationError, logVerificationSuccess } from '../_shared/verificationAuditlog.ts'
import { recordAadhaarApiCallEvent } from '../_shared/aadhaarApiCallEvents.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getSurepassConfig() {
  return {
    apiKey: Deno.env.get('SUREPASS_PRODUCTION_API_KEY') || '',
    // DigiLocker (Digiboost) runs on a different host than the aadhaar-v2 OTP
    // endpoints (SUREPASS_PRODUCTION_BASE_URL); falls back to the known host if unset.
    baseUrl: Deno.env.get('SUREPASS_DIGILOCKER_BASE_URL') || 'https://kyc-api.surepass.app',
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...payload } = await req.json()

    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    switch (action) {
      case 'initialize':
        return await handleInitialize(payload, supabaseClient)
      case 'downloadAadhaar':
        return await handleDownloadAadhaar(payload, supabaseClient)
      default:
        return jsonResponse({ success: false, error: 'Invalid action' }, 400)
    }
  } catch (error) {
    console.error('Aadhaar DigiLocker verification error:', error)
    return jsonResponse({ success: false, error: error.message || 'Internal server error' }, 500)
  }
})

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface DocumentContext {
  employeeId: string | null
  documentTypeId: string | null
  documentNumber: string | null
}

async function getDocumentContext(supabaseClient: any, documentId: string): Promise<DocumentContext> {
  const { data: document } = await supabaseClient
    .from('employee_documents')
    .select('employee_id, document_type_id, document_number')
    .eq('id', documentId)
    .single()

  return {
    employeeId: document?.employee_id ?? null,
    documentTypeId: document?.document_type_id ?? null,
    documentNumber: document?.document_number ?? null,
  }
}

async function recordDigiLockerAttempt(
  supabaseClient: any,
  context: DocumentContext,
  params: {
    documentId: string
    operation: 'digilocker_initialize' | 'digilocker_download'
    isSuccess: boolean
    requestGroupId?: string
    apiResponse?: unknown
    statusCode?: number
    errorMessage?: string
  }
) {
  const { employeeId } = context
  if (!employeeId) return

  // Provider stays 'surepass' (the actual vendor behind both the OTP and DigiLocker
  // products) — the operation value alone distinguishes a DigiLocker attempt.
  await recordAadhaarApiCallEvent({
    supabase: supabaseClient,
    employeeId,
    documentId: params.documentId,
    documentTypeId: context.documentTypeId,
    provider: 'surepass',
    primaryProvider: 'surepass',
    operation: params.operation,
    isSuccess: params.isSuccess,
    requestGroupId: params.requestGroupId,
    apiResponse: params.apiResponse,
  })

  // employee_verification_audit_log.latest_success_log is what the "view government
  // details" screen reads back (documents-list/index.tsx handleViewGovernment). A
  // successful `initialize` call never carries real Aadhaar data (just client_id/token)
  // — recording it here would let a later, no-op initialize (e.g. the background
  // prefetch firing just from re-opening the Verify dialog on an already-verified
  // document) silently overwrite the real data an earlier successful download wrote.
  // So only `digilocker_download` — the step that actually returns government data —
  // updates the audit log; `initialize` still gets counted above via the events table.
  if (params.operation !== 'digilocker_download') return

  const auditPayload = {
    employeeId,
    documentId: params.documentId,
    provider: 'surepass' as const,
    statusCode: params.statusCode,
    documentTypeId: context.documentTypeId ?? undefined,
    documentTypeName: 'AADHAAR',
    documentNumber: context.documentNumber ?? undefined,
  }

  if (params.isSuccess) {
    await logVerificationSuccess(supabaseClient, { ...auditPayload, response: params.apiResponse })
  } else {
    await logVerificationError(supabaseClient, { ...auditPayload, message: params.errorMessage })
  }
}

async function handleInitialize(payload: any, supabaseClient: any) {
  const { documentId } = payload

  const context: DocumentContext = documentId
    ? await getDocumentContext(supabaseClient, documentId)
    : { employeeId: null, documentTypeId: null, documentNumber: null }

  try {
    const { apiKey, baseUrl } = getSurepassConfig()

    const response = await fetch(`${baseUrl}/api/v1/digilocker/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          signup_flow: true,
          skip_main_screen: true,
          // Without this, Surepass doesn't fetch the Aadhaar XML — which is where
          // the profile photo (and full address) live — so download-aadhaar comes
          // back with only the coarser digilocker_metadata (name/dob/gender, no photo).
          aadhaar_xml: true,
        },
      }),
    })

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text()
      console.error('Non-JSON response from Surepass initialize:', textResponse.substring(0, 500))
      throw new Error(`DigiLocker initialize returned a non-JSON response (status ${response.status})`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Failed to initialize DigiLocker verification')
    }

    if (documentId) {
      const { error: updateError } = await supabaseClient
        .from('employee_documents')
        .update({
          api_verification_status: 'pending',
          api_verification_method: 'digilocker',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      if (updateError) {
        console.error('Error updating document after DigiLocker initialize:', updateError)
      }
    }

    if (documentId) {
      await recordDigiLockerAttempt(supabaseClient, context, {
        documentId,
        operation: 'digilocker_initialize',
        isSuccess: true,
        requestGroupId: data.data?.client_id ? String(data.data.client_id) : undefined,
        apiResponse: data,
        statusCode: response.status,
      })
    }

    return jsonResponse({
      success: true,
      client_id: data.data?.client_id,
      token: data.data?.token,
    })
  } catch (error) {
    console.error('DigiLocker initialize error:', error)

    if (documentId) {
      await recordDigiLockerAttempt(supabaseClient, context, {
        documentId,
        operation: 'digilocker_initialize',
        isSuccess: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      })
    }

    return jsonResponse({ success: false, error: error.message || 'Failed to initialize DigiLocker verification' })
  }
}

async function handleDownloadAadhaar(payload: any, supabaseClient: any) {
  const { digiLockerClientId, documentId } = payload

  if (!digiLockerClientId) {
    return jsonResponse({ success: false, error: 'digiLockerClientId is required' })
  }

  const context: DocumentContext = documentId
    ? await getDocumentContext(supabaseClient, documentId)
    : { employeeId: null, documentTypeId: null, documentNumber: null }

  try {
    const { apiKey, baseUrl } = getSurepassConfig()

    const response = await fetch(`${baseUrl}/api/v1/digilocker/download-aadhaar/${digiLockerClientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text()
      console.error('Non-JSON response from Surepass download-aadhaar:', textResponse.substring(0, 500))
      throw new Error(`DigiLocker download-aadhaar returned a non-JSON response (status ${response.status})`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Failed to download Aadhaar data from DigiLocker')
    }

    if (documentId) {
      const { data: document } = await supabaseClient
        .from('employee_documents')
        .select('employee_docs_log')
        .eq('id', documentId)
        .single()

      const existingLogs = document?.employee_docs_log || []
      const logEntry = {
        timestamp: new Date().toISOString(),
        // Must contain "verify" — the "click the Verified badge to view details" flow
        // (documents-list/index.tsx handleViewGovernment) searches employee_docs_log
        // for an entry whose action includes that substring.
        action: 'digilocker_verify_aadhaar',
        response: data,
      }

      const xmlData = data.data?.aadhaar_xml_data || {}
      const metadata = data.data?.digilocker_metadata || {}

      const { error: updateError } = await supabaseClient
        .from('employee_documents')
        .update({
          employee_docs_log: [...existingLogs, logEntry],
          api_response_data: data,
          api_verification_status: 'pending', // Kept pending until staff approves/rejects
          api_verification_method: 'digilocker',
          api_verification_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      if (updateError) {
        console.error('Error storing DigiLocker Aadhaar data:', updateError)
        throw updateError
      }

      const aadharVerifiedName = (xmlData.full_name || metadata.name || '').trim() || null
      if (aadharVerifiedName && context.employeeId) {
        await supabaseClient
          .from('employees')
          .update({ aadhar_verified_name: aadharVerifiedName })
          .eq('id', context.employeeId)
      }

      await recordDigiLockerAttempt(supabaseClient, context, {
        documentId,
        operation: 'digilocker_download',
        isSuccess: true,
        requestGroupId: digiLockerClientId,
        apiResponse: data,
        statusCode: response.status,
      })
    }

    return jsonResponse({
      success: true,
      data: data.data,
      message: 'Aadhaar data downloaded successfully',
    })
  } catch (error) {
    console.error('DigiLocker download error:', error)

    if (documentId) {
      await supabaseClient
        .from('employee_documents')
        .update({
          api_verification_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      await recordDigiLockerAttempt(supabaseClient, context, {
        documentId,
        operation: 'digilocker_download',
        isSuccess: false,
        requestGroupId: digiLockerClientId,
        errorMessage: error instanceof Error ? error.message : String(error),
      })
    }

    return jsonResponse({ success: false, error: error.message || 'Failed to download Aadhaar data' })
  }
}
