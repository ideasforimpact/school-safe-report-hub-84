import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...payload } = await req.json()
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('DigiLocker verification error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleInitialize(payload: any, supabaseClient: any) {
  const { documentId, redirectUrl } = payload

  try {
    console.log('DigiLocker initialize payload:', { documentId, redirectUrl })
    
    // Call DigiLocker initialize API
    const response = await fetch(`${Deno.env.get("SUREPASS_PRODUCTION_BASE_URL")}/api/v1/digilocker/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUREPASS_PRODUCTION_API_KEY')}`
      },
      body: JSON.stringify({
        data: {
          signup_flow: true,
          redirect_url: redirectUrl,
          skip_main_screen : true
        }
      })
    })

    console.log('DigiLocker API response status:', response)
    console.log('DigiLocker API response headers:', Object.fromEntries(response.headers.entries()))
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text()
      console.error('Non-JSON response:', textResponse.substring(0, 500))
      throw new Error(`API returned non-JSON response. Status: ${response.status}. Content-Type: ${contentType}`)
    }

    const data = await response.json()
    console.log('DigiLocker API response data:', data)
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to initialize DigiLocker verification')
    }

    // Store the initialization data in the database
    if (documentId) {
      const { error: updateError } = await supabaseClient
        .from('employee_documents')
        .update({
          api_response_data: data,
          api_verification_status: 'pending',
          api_verification_date: new Date().toISOString(),
          api_verification_method: 'digilocker'
        })
        .eq('id', documentId)

      if (updateError) {
        console.error('Error updating document:', updateError)
        // Don't fail the request, but log the error
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data.data,
        message: 'DigiLocker verification initialized successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('DigiLocker initialize error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to initialize DigiLocker verification'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleDownloadAadhaar(payload: any, supabaseClient: any) {
  const { digiLockerClientId, documentId } = payload

  try {
    console.log('DigiLocker download payload:', { digiLockerClientId, documentId })
    
    console.log(`https://kyc-api.surepass.app/api/v1/digilocker/download-aadhaar/${digiLockerClientId}`,"url");
    
    // Call DigiLocker download API
    const response = await fetch(`https://kyc-api.surepass.app/api/v1/digilocker/download-aadhaar/${digiLockerClientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUREPASS_PRODUCTION_API_KEY')}` 
      }
    })

    console.log('DigiLocker download response status:', response.status)
    console.log('DigiLocker download response headers:', Object.fromEntries(response.headers.entries()))
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text()
      console.error('Non-JSON response:', textResponse.substring(0, 500))
      throw new Error(`API returned non-JSON response. Status: ${response.status}. Content-Type: ${contentType}`)
    }

    const data = await response.json()
    console.log('DigiLocker download response data:', data)
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to download Aadhaar data from DigiLocker')
    }

    // Store the DigiLocker data without updating verification status
    // Status will be updated when user clicks Approve/Reject in the popup
    if (documentId) {
      const { error: updateError } = await supabaseClient
        .from('employee_documents')
        .update({
          api_response_data: data,
          api_verification_status: 'pending', // Keep as pending until user action
          api_verification_date: new Date().toISOString(),
          api_verification_method: 'digilocker'
        })
        .eq('id', documentId)

      if (updateError) {
        console.error('Error storing DigiLocker data:', updateError)
        throw updateError
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data.data,
        message: 'Aadhaar data downloaded successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('DigiLocker download error:', error)
    
    // Update document with failed status
    if (documentId) {
      await supabaseClient
        .from('employee_documents')
        .update({
          api_verification_status: 'failed',
          api_verification_date: new Date().toISOString()
        })
        .eq('id', documentId)
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to download Aadhaar data'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
} 