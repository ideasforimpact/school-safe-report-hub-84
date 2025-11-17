import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseServiceRoleKey();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { jobId, qty = 25, vt = 30 } = await req.json();

    // Process queued assessment template file uploads
    const { data: messages, error: receiveError } = await supabase.rpc('pgmq_read', {
      queue_name: 'assessment_template_uploads',
      vt: vt,
      qty: qty
    });

    if (receiveError) {
      throw receiveError;
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No jobs to process',
          processed: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let processed = 0;
    const errors = [];

    for (const message of messages) {
      try {
        const job = message.message;
        const { templateData, clientId, employeeId, files } = job;

        // Process file uploads for the template
        if (files && files.length > 0) {
          for (const file of files) {
            if (file.fileData) {
              // Upload file to storage
              const filePath = `assessment-templates/${clientId}/${employeeId}/${Date.now()}_${file.name}`;
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('assessment-files')
                .upload(filePath, base64ToBlob(file.fileData, file.type), {
                  contentType: file.type,
                  upsert: false
                });

              if (uploadError) {
                errors.push({ file: file.name, error: uploadError.message });
                continue;
              }

              // Update file reference in template data
              const fileUrl = `${supabaseUrl}/storage/v1/object/public/assessment-files/${filePath}`;
              // Process file URL update logic here
            }
          }
        }

        // Acknowledge message
        await supabase.rpc('pgmq_delete', {
          queue_name: 'assessment_template_uploads',
          msg_id: message.msg_id
        });

        processed++;

      } catch (jobError) {
        console.error('Error processing job:', jobError);
        errors.push({ jobId: message.msg_id, error: jobError.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processed,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in async-assessment-file-upload:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

