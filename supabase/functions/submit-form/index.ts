
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

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
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey(),
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const body = await req.json()
    const { formData, files } = body as {
      formData: any,
      files?: Record<string, Array<{ filename: string; contentType?: string; size?: number; base64Data: string }>>
    }

    // Validate required fields
    if (!formData?.form_id || !formData?.responses) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ensure is_anonymous has a default value if not provided (defaults to false)
    if (formData.is_anonymous === undefined) {
      formData.is_anonymous = false
    }

    // Insert form submission first (without attachments)
    // formData includes: form_id, client_id, submitter_name, submitter_email, submitter_phone,
    // submitter_type, responses, status, is_anonymous, and any other fields
    const { data: inserted, error: insertError } = await supabaseClient
      .from('form_submissions')
      .insert([formData])
      .select()
      .single()

    if (insertError || !inserted) {
      console.error('Error inserting submission:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to submit form' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If files provided, upload to storage and build attachments object
    let attachments: Record<string, Array<{ fieldId?: string; filename: string; url: string; path: string; size?: number }>> | null = null
    // Support both { files: { fieldId: [...] } } and legacy { attachments: [...] } at top-level
    const filesInput: Record<string, Array<{ filename: string; contentType?: string; size?: number; base64Data: string }>> | null =
      files && Object.keys(files).length > 0
        ? files as any
        : (body.attachments ? { attachments: body.attachments } : null)

    if (filesInput && Object.keys(filesInput).length > 0) {
      attachments = {}
      const clientId = formData.client_id || 'unknown-client'
      const targetPrefix = `${clientId}/${inserted.id}`

      for (const [fieldId, fileItems] of Object.entries(filesInput)) {
        if (!fileItems || fileItems.length === 0) continue

        const listForField: Array<{ fieldId?: string; filename: string; url: string; path: string; size?: number }> = []
        for (const f of fileItems) {
          // Clean file name and create unique path
          const safeName = (f.filename || `file_${Date.now()}`).replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
          const fileName = `${Date.now()}_${safeName}`
          const relativePath = `${targetPrefix}/${fileName}`

          const base64 = (f.base64Data || '').includes(',') ? (f.base64Data || '').split(',').pop()! : (f.base64Data || '')
          const bytes = decodeBase64(base64)

          const { error: uploadError } = await supabaseClient.storage
            .from('form-attachments')
            .upload(relativePath, bytes, {
              contentType: f.contentType || 'application/octet-stream',
              upsert: false,
            })

          if (uploadError) {
            console.error('Upload error:', uploadError)
            return new Response(
              JSON.stringify({ error: `Failed to upload file: ${f.filename}` }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const { data: urlData } = supabaseClient.storage
            .from('form-attachments')
            .getPublicUrl(relativePath)

          const fullPath = `form-attachments/${relativePath}`

          listForField.push({
            fieldId,
            filename: f.filename,
            url: urlData.publicUrl,
            path: fullPath,
            size: f.size,
          })
        }

        if (listForField.length > 0) {
          attachments[fieldId] = listForField
        }
      }

      // Flatten to an array for the DB column, to simplify consumers
      const flatAttachments = Object.values(attachments).flat()

      // Update the row with attachments JSON
      const { error: updateErr, data: updatedRow } = await supabaseClient
        .from('form_submissions')
        .update({ attachments: flatAttachments as any })
        .eq('id', inserted.id)
        .select()
        .single()

      if (updateErr) {
        console.error('Error updating attachments:', updateErr)
        return new Response(
          JSON.stringify({ error: 'Failed to finalize submission attachments' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data: updatedRow }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // No files case – return the inserted row
    return new Response(
      JSON.stringify({ success: true, data: inserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
